using UnityEngine;
using Slegnuce.Simulation;

namespace Slegnuce.Interaction
{
    public enum ScenarioInteractionAction
    {
        CommitChoice,
        Advance
    }

    public sealed class ScenarioInteractionBinding : MonoBehaviour
    {
        [SerializeField] private ScenarioInteractionAction action = ScenarioInteractionAction.CommitChoice;
        [SerializeField] private string scenarioId;
        [SerializeField] private string choiceId;
        [SerializeField] private Transform interactionAnchor;

        private RunEngine engine;

        public Transform InteractionAnchor => interactionAnchor != null ? interactionAnchor : transform;

        public void Configure(ScenarioInteractionAction value, string scenario, string choice, Transform anchor)
        {
            action = value;
            scenarioId = scenario;
            choiceId = choice;
            interactionAnchor = anchor;
        }

        public void Bind(RunEngine value)
        {
            engine = value;
        }

        public bool TryExecute()
        {
            if (engine == null || engine.State == null) return false;

            ScenarioDefinition current = engine.CurrentScenario;
            if (current == null || (!string.IsNullOrEmpty(scenarioId) && current.id != scenarioId)) return false;

            bool alreadyCommitted = engine.State.log.Exists(x => x.scenarioIndex == engine.State.scenarioIndex);

            if (action == ScenarioInteractionAction.Advance)
            {
                if (!alreadyCommitted) return false;
                engine.Advance();
                return true;
            }

            if (alreadyCommitted) return false;

            for (int i = 0; i < current.choices.Count; i++)
            {
                if (current.choices[i].id != choiceId) continue;

                string reason;
                if (!engine.CanChoose(i, out reason))
                {
                    Debug.Log("[ScenarioInteraction] Blocked " + choiceId + ": " + reason);
                    return false;
                }

                return engine.CommitChoice(i);
            }

            Debug.LogWarning("[ScenarioInteraction] Choice not found: " + choiceId);
            return false;
        }
    }
}
