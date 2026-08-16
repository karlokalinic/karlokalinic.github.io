using System.Linq;
using UnityEngine;

namespace Slegnuce.Simulation
{
    public sealed class PrototypeShelterView : MonoBehaviour
    {
        private RunEngine engine;
        private GUIStyle titleStyle;
        private GUIStyle bodyStyle;
        private GUIStyle smallStyle;
        private Vector2 scroll;

        public void Bind(RunEngine value)
        {
            engine = value;
        }

        private void OnGUI()
        {
            if (engine == null || engine.State == null) return;
            EnsureStyles();

            Rect area = new Rect(24, 24, Mathf.Min(760, Screen.width - 48), Screen.height - 48);
            GUILayout.BeginArea(area, GUI.skin.box);
            scroll = GUILayout.BeginScrollView(scroll);

            GUILayout.Label("SLEGNUĆE · UNITY ROUND-TRIP SLICE", titleStyle);
            GUILayout.Label("Ovo je development harness, ne finalni UI. Njegov posao je dokazati autoritet stanja, choice gating, serializaciju i browser restore prije art produkcije.", bodyStyle);
            GUILayout.Space(12);

            DrawState();
            GUILayout.Space(16);

            ScenarioDefinition scenario = engine.CurrentScenario;
            if (scenario != null)
            {
                DrawScenario(scenario);
            }
            else
            {
                DrawCompletedRun();
            }

            GUILayout.EndScrollView();
            GUILayout.EndArea();
        }

        private void DrawState()
        {
            RunState s = engine.State;
            GUILayout.Label("STATE", smallStyle);
            GUILayout.Label(
                "VODA " + s.water + "   HRANA " + s.food + "   LIJEKOVI " + s.medicine +
                "   INFO " + s.information + "   STRES " + s.stress + "   BILJEG " + s.biljeg,
                bodyStyle);
            GUILayout.Label("SCHEMA " + s.schema + "   SEED " + s.seed + "   FINGERPRINT " + engine.Fingerprint(), smallStyle);

            string roster = string.Join(" · ", s.characters.Select(c => c.id + ":" + c.presence));
            GUILayout.Label("ROSTER  " + roster, smallStyle);
        }

        private void DrawScenario(ScenarioDefinition scenario)
        {
            GUILayout.Label(scenario.time + " · " + scenario.source, smallStyle);
            GUILayout.Label(scenario.title, titleStyle);
            GUILayout.Label(scenario.body, bodyStyle);
            GUILayout.Space(6);
            GUILayout.Label(scenario.quote, bodyStyle);
            GUILayout.Space(14);

            bool committed = engine.State.log.Exists(x => x.scenarioIndex == engine.State.scenarioIndex);

            for (int i = 0; i < scenario.choices.Count; i++)
            {
                ScenarioChoice choice = scenario.choices[i];
                string reason;
                bool canChoose = engine.CanChoose(i, out reason);

                GUI.enabled = !committed && canChoose;
                if (GUILayout.Button(choice.label + "\n" + choice.detail, GUILayout.MinHeight(58)))
                {
                    engine.CommitChoice(i);
                }
                GUI.enabled = true;

                if (!canChoose)
                {
                    GUILayout.Label("NEDOSTUPNO: " + reason, smallStyle);
                }
            }

            if (committed)
            {
                RunLogEntry entry = engine.State.log[engine.State.log.Count - 1];
                GUILayout.Space(10);
                GUILayout.Label("ZAPISANO: " + entry.result, bodyStyle);
                if (GUILayout.Button("ZATVORI SCENU → RUN_COMPLETE", GUILayout.MinHeight(42)))
                {
                    engine.Advance();
                }
            }
        }

        private void DrawCompletedRun()
        {
            GUILayout.Label("RUN COMPLETE", titleStyle);
            GUILayout.Label("State više ne ovisi o ovoj sceni. JSON ispod je isti objekt koji Web bridge sprema i kasnije vraća kroz RESTORE_RUN.", bodyStyle);
            GUILayout.Space(8);
            GUILayout.TextArea(engine.ExportJson(), GUILayout.MinHeight(220));

            if (GUILayout.Button("KOPIRAJ RUN JSON"))
            {
                GUIUtility.systemCopyBuffer = engine.ExportCompactJson();
            }

            if (GUILayout.Button("NOVI RUN"))
            {
                engine.StartNewRun();
            }
        }

        private void EnsureStyles()
        {
            if (titleStyle != null) return;

            titleStyle = new GUIStyle(GUI.skin.label)
            {
                fontSize = 24,
                fontStyle = FontStyle.Bold,
                wordWrap = true
            };
            bodyStyle = new GUIStyle(GUI.skin.label)
            {
                fontSize = 14,
                wordWrap = true
            };
            smallStyle = new GUIStyle(GUI.skin.label)
            {
                fontSize = 11,
                wordWrap = true
            };
        }
    }
}
