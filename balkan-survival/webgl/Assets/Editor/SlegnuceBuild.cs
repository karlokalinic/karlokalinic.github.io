using System;
using System.IO;
using UnityEditor;
using UnityEditor.Build;
using UnityEditor.Build.Reporting;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;
using Slegnuce.Simulation;

namespace Slegnuce.Editor
{
    public static class SlegnuceBuild
    {
        private const string ScenePath = "Assets/Scenes/PrototypeShelter.unity";
        private const string ProductVersion = "0.2.0-dev";

        [MenuItem("Slegnuće/Bootstrap/Regenerate Prototype Scene")]
        public static void RegeneratePrototypeSceneFromMenu()
        {
            if (!EditorSceneManager.SaveCurrentModifiedScenesIfUserWantsTo()) return;
            EnsurePrototypeScene();
            Debug.Log("[SlegnuceBuild] Prototype scene regenerated at " + ScenePath);
        }

        [MenuItem("Slegnuće/Tests/Run Buildability Self-Test")]
        public static void RunSelfTestsFromMenu()
        {
            SlegnuceSelfTest.RunAll();
        }

        [MenuItem("Slegnuće/Build/Development Web")]
        public static void BuildDevelopmentWebFromMenu()
        {
            if (EditorUserBuildSettings.activeBuildTarget != BuildTarget.WebGL)
            {
                bool switched = EditorUserBuildSettings.SwitchActiveBuildTarget(BuildTargetGroup.WebGL, BuildTarget.WebGL);
                if (!switched) throw new BuildFailedException("Could not switch active build target to WebGL. Is Web Build Support installed?");
            }
            BuildDevelopmentWeb();
        }

        public static void BuildDevelopmentWeb()
        {
            if (!BuildPipeline.IsBuildTargetSupported(BuildTargetGroup.WebGL, BuildTarget.WebGL))
            {
                throw new BuildFailedException("WebGL build target is unavailable. Install Web Build Support for this Unity editor version.");
            }

            if (EditorUserBuildSettings.activeBuildTarget != BuildTarget.WebGL)
            {
                throw new BuildFailedException("Batch build must start with -buildTarget WebGL. Switching build targets from executeMethod is intentionally avoided.");
            }

            EnsurePrototypeScene();
            SlegnuceSelfTest.RunAll();

            PlayerSettings.companyName = "KARLOLEGEND";
            PlayerSettings.productName = "Slegnuće";
            PlayerSettings.bundleVersion = ProductVersion;
            PlayerSettings.WebGL.template = "PROJECT:Slegnuce";

            string output = Environment.GetEnvironmentVariable("SLEGNUCE_WEBGL_OUTPUT");
            if (string.IsNullOrWhiteSpace(output))
            {
                output = Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "Builds", "WebGL-Development"));
            }
            Directory.CreateDirectory(output);

            BuildPlayerOptions options = new BuildPlayerOptions
            {
                scenes = new[] { ScenePath },
                locationPathName = output,
                target = BuildTarget.WebGL,
                options = BuildOptions.Development
            };

            Debug.Log("[SlegnuceBuild] Building Development Web player to " + output);
            BuildReport report = BuildPipeline.BuildPlayer(options);
            BuildSummary summary = report.summary;
            if (summary.result != BuildResult.Succeeded)
            {
                throw new BuildFailedException("WebGL build failed: " + summary.result + ", errors=" + summary.totalErrors + ", warnings=" + summary.totalWarnings);
            }

            Debug.Log("[SlegnuceBuild] BUILD PASS — bytes=" + summary.totalSize + ", time=" + summary.totalTime + ", output=" + summary.outputPath);
        }

        private static void EnsurePrototypeScene()
        {
            string directory = Path.GetDirectoryName(ScenePath);
            if (!string.IsNullOrEmpty(directory)) Directory.CreateDirectory(directory);

            Scene scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);

            GameObject cameraObject = new GameObject("Main Camera");
            Camera camera = cameraObject.AddComponent<Camera>();
            cameraObject.tag = "MainCamera";
            camera.clearFlags = CameraClearFlags.SolidColor;
            camera.backgroundColor = new Color(0.047f, 0.051f, 0.043f, 1f);
            camera.orthographic = true;
            camera.transform.position = new Vector3(0f, 0f, -10f);

            new GameObject("SlegnucePrototypeBootstrap").AddComponent<PrototypeBootstrap>();

            if (!EditorSceneManager.SaveScene(scene, ScenePath))
            {
                throw new BuildFailedException("Could not save generated prototype scene at " + ScenePath);
            }

            EditorBuildSettings.scenes = new[] { new EditorBuildSettingsScene(ScenePath, true) };
            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();
        }
    }
}
