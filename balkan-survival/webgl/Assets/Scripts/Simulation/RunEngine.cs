using System;
using System.Collections.Generic;
using UnityEngine;
using Slegnuce.Web;

namespace Slegnuce.Simulation
{
    public sealed class RunEngine : MonoBehaviour
    {
        [SerializeField] private string build = "unity-dev";
        [SerializeField] private List<ScenarioDefinition> scenarios = new List<ScenarioDefinition>();

        public RunState State { get; private set; }

        public ScenarioDefinition CurrentScenario
        {
            get
            {
                if (State == null) return null;
                if (State.scenarioIndex < 0 || State.scenarioIndex >= scenarios.Count) return null;
                return scenarios[State.scenarioIndex];
            }
        }

        public event Action<RunState> StateChanged;
        public event Action<ScenarioDefinition> ScenarioChanged;

        public void StartNewRun(string seed = null)
        {
            if (string.IsNullOrWhiteSpace(seed))
            {
                seed = Guid.NewGuid().ToString("N").Substring(0, 8).ToUpperInvariant();
            }

            State = new RunState
            {
                build = build,
                seed = seed,
                scenarioIndex = 0
            };

            AssignRoster(seed);
            Emit("RUN_STARTED", JsonUtility.ToJson(State));
            EmitScenario();
            StateChanged?.Invoke(State);
        }

        public bool CanChoose(int choiceIndex, out string reason)
        {
            reason = string.Empty;
            ScenarioDefinition scenario = CurrentScenario;
            if (scenario == null || choiceIndex < 0 || choiceIndex >= scenario.choices.Count)
            {
                reason = "Invalid scenario or choice.";
                return false;
            }

            ScenarioChoice choice = scenario.choices[choiceIndex];
            if (choice.carrier != CharacterId.None && State.Character(choice.carrier).presence != PresenceState.Active)
            {
                reason = choice.carrier + " is not active.";
                return false;
            }

            foreach (ScenarioCondition condition in choice.conditions)
            {
                if (!Evaluate(condition))
                {
                    reason = "Condition failed: " + condition.kind + ".";
                    return false;
                }
            }

            return true;
        }

        public bool CommitChoice(int choiceIndex)
        {
            string reason;
            if (!CanChoose(choiceIndex, out reason))
            {
                Debug.LogWarning("[RunEngine] Choice rejected: " + reason);
                return false;
            }

            ScenarioDefinition scenario = CurrentScenario;
            ScenarioChoice choice = scenario.choices[choiceIndex];
            foreach (ScenarioEffect effect in choice.effects) Apply(effect);

            State.log.Add(new RunLogEntry
            {
                scenarioIndex = State.scenarioIndex,
                scenarioId = scenario.id,
                choiceId = choice.id,
                result = choice.resultText
            });

            ChoiceCommittedPayload payload = new ChoiceCommittedPayload
            {
                scenarioId = scenario.id,
                choiceId = choice.id,
                state = State
            };

            Emit("CHOICE_COMMITTED", JsonUtility.ToJson(payload));
            StateChanged?.Invoke(State);
            return true;
        }

        public bool Advance()
        {
            if (State == null) return false;

            State.scenarioIndex++;
            if (State.scenarioIndex >= scenarios.Count)
            {
                CompleteRun();
                return false;
            }

            EmitScenario();
            StateChanged?.Invoke(State);
            return true;
        }

        public string ExportJson()
        {
            return State == null ? "{}" : JsonUtility.ToJson(State, true);
        }

        public void RestoreJson(string json)
        {
            if (string.IsNullOrWhiteSpace(json)) return;
            State = JsonUtility.FromJson<RunState>(json);
            if (State == null) return;
            StateChanged?.Invoke(State);
            EmitScenario();
        }

        private void AssignRoster(string seed)
        {
            System.Random rng = new System.Random(StableHash(seed));
            List<CharacterId> ids = new List<CharacterId>
            {
                CharacterId.Mira,
                CharacterId.Davor,
                CharacterId.Ena,
                CharacterId.Ivan
            };

            for (int i = ids.Count - 1; i > 0; i--)
            {
                int j = rng.Next(i + 1);
                CharacterId temp = ids[i];
                ids[i] = ids[j];
                ids[j] = temp;
            }

            int activeCount = rng.NextDouble() < 0.62 ? 2 : 3;
            for (int i = 0; i < ids.Count; i++)
            {
                State.characters.Add(new CharacterRunState
                {
                    id = ids[i],
                    presence = i < activeCount
                        ? PresenceState.Active
                        : i == activeCount ? PresenceState.Reachable : PresenceState.Absent,
                    bond = 0
                });
            }
        }

        private bool Evaluate(ScenarioCondition condition)
        {
            switch (condition.kind)
            {
                case ConditionKind.ResourceAtLeast:
                    return State.Get(condition.resource) >= condition.minimum;
                case ConditionKind.TokenAtLeast:
                    return State.Get(condition.token) >= condition.minimum;
                case ConditionKind.FlagIs:
                    return State.Get(condition.flag) == condition.expectedFlag;
                case ConditionKind.CharacterPresenceIs:
                    return State.Character(condition.character).presence == condition.presence;
                default:
                    return false;
            }
        }

        private void Apply(ScenarioEffect effect)
        {
            switch (effect.kind)
            {
                case EffectKind.AddResource:
                    State.Add(effect.resource, effect.amount);
                    break;
                case EffectKind.AddToken:
                    State.Add(effect.token, effect.amount);
                    break;
                case EffectKind.SetFlag:
                    State.Set(effect.flag, effect.flagValue);
                    break;
                case EffectKind.AddBond:
                    CharacterRunState bondTarget = State.Character(effect.character);
                    bondTarget.bond = Mathf.Clamp(bondTarget.bond + effect.amount, -5, 5);
                    break;
                case EffectKind.SetPresence:
                    State.Character(effect.character).presence = effect.presence;
                    break;
            }
        }

        private void EmitScenario()
        {
            ScenarioDefinition scenario = CurrentScenario;
            if (scenario == null) return;

            ScenarioChanged?.Invoke(scenario);
            SceneChangedPayload payload = new SceneChangedPayload
            {
                index = State.scenarioIndex,
                scenarioId = scenario.id,
                time = scenario.time,
                source = scenario.source,
                title = scenario.title
            };
            Emit("SCENE_CHANGED", JsonUtility.ToJson(payload));
        }

        private void CompleteRun()
        {
            string json = ExportJson();
            Emit("RUN_COMPLETE", json);
            if (SlegnuceWebBridge.Instance != null) SlegnuceWebBridge.Instance.SaveRun(json);
        }

        private static void Emit(string type, string payload)
        {
            if (SlegnuceWebBridge.Instance != null) SlegnuceWebBridge.Instance.Emit(type, payload);
            else Debug.Log("[RunEngine] " + type + ": " + payload);
        }

        private static int StableHash(string text)
        {
            unchecked
            {
                int hash = 17;
                foreach (char c in text) hash = hash * 31 + c;
                return hash;
            }
        }

        [Serializable]
        private sealed class SceneChangedPayload
        {
            public int index;
            public string scenarioId;
            public string time;
            public string source;
            public string title;
        }

        [Serializable]
        private sealed class ChoiceCommittedPayload
        {
            public string scenarioId;
            public string choiceId;
            public RunState state;
        }
    }
}
