using System;
using System.Collections.Generic;
using UnityEditor.Build;
using UnityEngine;
using Slegnuce.Simulation;

namespace Slegnuce.Editor
{
    public static class SlegnuceSelfTest
    {
        public static void RunAll()
        {
            Run("choice mutation + log", TestChoiceMutation);
            Run("round-trip fingerprint", TestRoundTripFingerprint);
            Run("schema rejection", TestSchemaRejection);
            Run("character gating", TestCharacterGating);
            Run("new run reset", TestNewRunReset);
            Debug.Log("[SlegnuceSelfTest] PASS — 5/5 buildability tests.");
        }

        private static void Run(string name, Action test)
        {
            try
            {
                test();
                Debug.Log("[SlegnuceSelfTest] PASS: " + name);
            }
            catch (Exception ex)
            {
                throw new BuildFailedException("Slegnuce self-test failed: " + name + " — " + ex.Message);
            }
        }

        private static void TestChoiceMutation()
        {
            WithEngine(engine =>
            {
                engine.StartNewRun("SELFTEST-GIVE");
                Require(engine.State.water == 7, "Initial water must be 7.");
                Require(engine.CommitChoice(0), "give_two_liters must be legal with 7 L.");
                Require(engine.State.water == 5, "Giving two litres must leave 5 L.");
                Require(engine.State.biljeg == 1, "Giving water must create one BILJEG.");
                Require(engine.State.neighborHelped, "NeighborHelped must be true.");
                Require(engine.State.log.Count == 1, "Choice must append exactly one RunLog entry.");
                Require(engine.State.log[0].scenarioId == "two_liters", "RunLog scenario id changed unexpectedly.");
                Require(engine.State.log[0].choiceId == "give_two_liters", "RunLog choice id changed unexpectedly.");
            });
        }

        private static void TestRoundTripFingerprint()
        {
            GameObject sourceObject = null;
            GameObject restoredObject = null;
            List<ScenarioDefinition> sourceScenarios = null;
            List<ScenarioDefinition> restoredScenarios = null;
            try
            {
                RunEngine source = CreateEngine("SelfTestSource", out sourceObject, out sourceScenarios);
                source.StartNewRun("SELFTEST-ROUNDTRIP");
                Require(source.CommitChoice(0), "Source choice commit failed.");
                string before = source.Fingerprint();
                string json = source.ExportCompactJson();

                RunEngine restored = CreateEngine("SelfTestRestored", out restoredObject, out restoredScenarios);
                Require(restored.RestoreJson(json), "RestoreJson rejected a supported payload.");
                string after = restored.Fingerprint();

                Require(before == after, "Fingerprint changed across export/restore: " + before + " != " + after);
                Require(restored.State.water == source.State.water, "Water changed across round-trip.");
                Require(restored.State.log.Count == source.State.log.Count, "RunLog length changed across round-trip.");
            }
            finally
            {
                DestroyFixture(sourceObject, sourceScenarios);
                DestroyFixture(restoredObject, restoredScenarios);
            }
        }

        private static void TestSchemaRejection()
        {
            WithEngine(engine =>
            {
                engine.StartNewRun("SELFTEST-SCHEMA");
                string fingerprint = engine.Fingerprint();
                string invalid = engine.ExportCompactJson().Replace("\"slegnuce.run/1\"", "\"slegnuce.run/999\"");
                Require(!engine.RestoreJson(invalid), "Unsupported schema must be rejected.");
                Require(engine.Fingerprint() == fingerprint, "Rejected restore must not mutate authoritative state.");
            });
        }

        private static void TestCharacterGating()
        {
            WithEngine(engine =>
            {
                engine.StartNewRun("SELFTEST-CARRIER");
                engine.State.Character(CharacterId.Mira).presence = PresenceState.Absent;
                string reason;
                Require(!engine.CanChoose(1, out reason), "Mira-only choice must be illegal while Mira is absent.");
                Require(reason.Contains("Mira"), "Carrier rejection should identify Mira.");

                engine.State.Character(CharacterId.Mira).presence = PresenceState.Active;
                Require(engine.CanChoose(1, out reason), "Mira-only choice must become legal when Mira is active and water exists.");
            });
        }

        private static void TestNewRunReset()
        {
            WithEngine(engine =>
            {
                engine.StartNewRun("SELFTEST-RESET-A");
                Require(engine.CommitChoice(0), "First run mutation failed.");
                Require(engine.State.water == 5 && engine.State.biljeg == 1 && engine.State.log.Count == 1, "First run did not reach expected mutated state.");

                engine.StartNewRun("SELFTEST-RESET-B");
                Require(engine.State.water == 7, "New run inherited water from previous run.");
                Require(engine.State.biljeg == 0, "New run inherited BILJEG from previous run.");
                Require(engine.State.log.Count == 0, "New run inherited RunLog from previous run.");
                Require(!engine.State.neighborHelped, "New run inherited NeighborHelped flag.");
            });
        }

        private static void WithEngine(Action<RunEngine> test)
        {
            GameObject owner = null;
            List<ScenarioDefinition> scenarios = null;
            try
            {
                RunEngine engine = CreateEngine("SlegnuceSelfTestEngine", out owner, out scenarios);
                test(engine);
            }
            finally
            {
                DestroyFixture(owner, scenarios);
            }
        }

        private static RunEngine CreateEngine(string name, out GameObject owner, out List<ScenarioDefinition> scenarios)
        {
            owner = new GameObject(name);
            RunEngine engine = owner.AddComponent<RunEngine>();
            engine.SetBuild("unity-buildability-selftest");
            scenarios = PrototypeScenarioFactory.CreateFirstSlice();
            engine.ConfigureScenarios(scenarios);
            return engine;
        }

        private static void DestroyFixture(GameObject owner, List<ScenarioDefinition> scenarios)
        {
            if (owner != null) UnityEngine.Object.DestroyImmediate(owner);
            if (scenarios == null) return;
            foreach (ScenarioDefinition scenario in scenarios)
            {
                if (scenario != null) UnityEngine.Object.DestroyImmediate(scenario);
            }
        }

        private static void Require(bool condition, string message)
        {
            if (!condition) throw new InvalidOperationException(message);
        }
    }
}
