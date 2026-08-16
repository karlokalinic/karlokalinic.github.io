using System;
using System.IO;
using UnityEditor;
using UnityEditor.Build;
using UnityEditor.Build.Reporting;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.SceneManagement;
using Slegnuce.Simulation;
using Slegnuce.Presentation;
using Slegnuce.Interaction;

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

        [MenuItem("Slegnuće/Build/Prepare Cloud Build")]
        public static void PrepareCloudBuildFromMenu()
        {
            PreExportCloud();
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

        public static void PreExportCloud()
        {
            EnsurePrototypeScene();
            SlegnuceSelfTest.RunAll();

            string releaseVersion = ResolveCloudVersion();
            ConfigureCommonPlayerSettings(releaseVersion);
            PlayerSettings.WebGL.compressionFormat = WebGLCompressionFormat.Disabled;

            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();

            Debug.Log(
                "[SlegnuceBuild] CLOUD PRE-EXPORT PASS — version=" + releaseVersion +
                ", target=" + EditorUserBuildSettings.activeBuildTarget +
                ", commit=" + (Environment.GetEnvironmentVariable("GIT_COMMIT") ?? "unknown")
            );
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
            ConfigureCommonPlayerSettings(ProductVersion);

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

        private static void ConfigureCommonPlayerSettings(string version)
        {
            PlayerSettings.companyName = "KARLOLEGEND";
            PlayerSettings.productName = "Slegnuće";
            PlayerSettings.bundleVersion = version;
            PlayerSettings.WebGL.template = "PROJECT:Slegnuce";
        }

        private static string ResolveCloudVersion()
        {
            string explicitVersion = Environment.GetEnvironmentVariable("SLEGNUCE_RELEASE_VERSION");
            if (!string.IsNullOrWhiteSpace(explicitVersion)) return explicitVersion;

            string buildNumber = Environment.GetEnvironmentVariable("BUILD_NUMBER");
            if (string.IsNullOrWhiteSpace(buildNumber)) buildNumber = "0";
            return "0.2.0-rc." + buildNumber;
        }

        private static void EnsurePrototypeScene()
        {
            string directory = Path.GetDirectoryName(ScenePath);
            if (!string.IsNullOrEmpty(directory)) Directory.CreateDirectory(directory);

            Scene scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            ConfigureAtmosphere();

            GameObject composition = new GameObject("SHELTER_2_5D_PRESENTATION");

            Camera camera = CreateCamera(composition.transform);
            CreateEnvironment(composition.transform, out GameObject primaryBottle, out GameObject reserveBottle, out GameObject cup, out Light practicalLight);

            CharacterPresentation playerVisual;
            GameObject player = CreateCharacter(
                "PLAYER",
                composition.transform,
                new Vector3(-1.85f, 0f, -1.55f),
                new Color(0.29f, 0.31f, 0.25f, 1f),
                0.35f,
                out playerVisual);
            player.transform.rotation = Quaternion.Euler(0f, 24f, 0f);
            ClickToMoveController mover = player.AddComponent<ClickToMoveController>();
            mover.Configure(camera, 2.35f, new Vector2(-4.15f, 4.15f), new Vector2(-2.55f, 2.35f));

            CharacterPresentation neighborVisual;
            GameObject neighbor = CreateCharacter(
                "IVAN_NEIGHBOR",
                composition.transform,
                new Vector3(2.75f, 0f, 1.2f),
                new Color(0.34f, 0.23f, 0.20f, 1f),
                2.1f,
                out neighborVisual);
            neighbor.transform.rotation = Quaternion.Euler(0f, -145f, 0f);
            CapsuleCollider neighborCollider = neighbor.AddComponent<CapsuleCollider>();
            neighborCollider.center = new Vector3(0f, 1.03f, 0f);
            neighborCollider.height = 2.05f;
            neighborCollider.radius = 0.42f;

            GameObject neighborAnchor = new GameObject("InteractionAnchor_GiveWater");
            neighborAnchor.transform.SetParent(composition.transform, false);
            neighborAnchor.transform.position = new Vector3(1.92f, 0f, 0.55f);
            ScenarioInteractionBinding neighborInteraction = neighbor.AddComponent<ScenarioInteractionBinding>();
            neighborInteraction.Configure(ScenarioInteractionAction.CommitChoice, "two_liters", "give_two_liters", neighborAnchor.transform);

            GameObject exitDoor = GameObject.Find("EXIT_DOOR");
            GameObject doorAnchor = new GameObject("InteractionAnchor_Exit");
            doorAnchor.transform.SetParent(composition.transform, false);
            doorAnchor.transform.position = new Vector3(3.25f, 0f, 1.72f);
            ScenarioInteractionBinding exitInteraction = exitDoor.AddComponent<ScenarioInteractionBinding>();
            exitInteraction.Configure(ScenarioInteractionAction.Advance, "two_liters", string.Empty, doorAnchor.transform);

            ShelterPresentationController presentation = composition.AddComponent<ShelterPresentationController>();
            presentation.Configure(primaryBottle, reserveBottle, cup, neighborVisual, practicalLight);

            new GameObject("SlegnucePrototypeBootstrap").AddComponent<PrototypeBootstrap>();

            if (!EditorSceneManager.SaveScene(scene, ScenePath))
            {
                throw new BuildFailedException("Could not save generated prototype scene at " + ScenePath);
            }

            EditorBuildSettings.scenes = new[] { new EditorBuildSettingsScene(ScenePath, true) };
            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();
        }

        private static void ConfigureAtmosphere()
        {
            RenderSettings.fog = true;
            RenderSettings.fogMode = FogMode.Linear;
            RenderSettings.fogColor = new Color(0.105f, 0.11f, 0.10f, 1f);
            RenderSettings.fogStartDistance = 10f;
            RenderSettings.fogEndDistance = 24f;
            RenderSettings.ambientMode = AmbientMode.Trilight;
            RenderSettings.ambientSkyColor = new Color(0.18f, 0.19f, 0.17f, 1f);
            RenderSettings.ambientEquatorColor = new Color(0.105f, 0.10f, 0.085f, 1f);
            RenderSettings.ambientGroundColor = new Color(0.055f, 0.052f, 0.046f, 1f);
            RenderSettings.ambientIntensity = 0.72f;
        }

        private static Camera CreateCamera(Transform parent)
        {
            GameObject cameraObject = new GameObject("Main Camera");
            cameraObject.transform.SetParent(parent, false);
            cameraObject.tag = "MainCamera";
            Camera camera = cameraObject.AddComponent<Camera>();
            cameraObject.AddComponent<AudioListener>();
            SlegnuceCameraRig rig = cameraObject.AddComponent<SlegnuceCameraRig>();
            rig.Configure(camera, new Vector3(8.8f, 7.4f, -11.6f), new Vector3(0f, 1.15f, 0.25f), 26f);

            GameObject keyObject = new GameObject("ColdWindowKey");
            keyObject.transform.SetParent(parent, false);
            keyObject.transform.rotation = Quaternion.Euler(42f, -28f, 0f);
            Light key = keyObject.AddComponent<Light>();
            key.type = LightType.Directional;
            key.color = new Color(0.72f, 0.78f, 0.82f, 1f);
            key.intensity = 0.72f;
            key.shadows = LightShadows.Soft;

            return camera;
        }

        private static void CreateEnvironment(
            Transform parent,
            out GameObject primaryBottle,
            out GameObject reserveBottle,
            out GameObject cup,
            out Light practicalLight)
        {
            Color floorTone = new Color(0.23f, 0.21f, 0.17f, 1f);
            Color wallTone = new Color(0.43f, 0.42f, 0.35f, 1f);
            Color dampTone = new Color(0.20f, 0.23f, 0.20f, 1f);
            Color furnitureTone = new Color(0.24f, 0.18f, 0.13f, 1f);
            Color metalTone = new Color(0.32f, 0.33f, 0.29f, 1f);

            GameObject floor = CreatePrimitive("NAVIGATION_FLOOR", PrimitiveType.Cube, parent, new Vector3(0f, -0.10f, 0f), new Vector3(9.5f, 0.20f, 6.2f), floorTone, true);
            floor.tag = "Respawn";
            CreatePrimitive("BACK_WALL", PrimitiveType.Cube, parent, new Vector3(0f, 1.5f, 2.95f), new Vector3(9.5f, 3f, 0.18f), wallTone, true);
            CreatePrimitive("LEFT_WALL", PrimitiveType.Cube, parent, new Vector3(-4.65f, 1.5f, 0f), new Vector3(0.18f, 3f, 6.0f), dampTone, true);

            CreatePrimitive("WINDOW_VOID", PrimitiveType.Cube, parent, new Vector3(-1.9f, 1.75f, 2.82f), new Vector3(2.1f, 1.15f, 0.08f), new Color(0.075f, 0.09f, 0.095f, 1f), false);
            CreatePrimitive("TABLE", PrimitiveType.Cube, parent, new Vector3(0.15f, 0.55f, -0.05f), new Vector3(2.2f, 1.1f, 1.20f), furnitureTone, true);
            CreatePrimitive("KITCHEN_COUNTER", PrimitiveType.Cube, parent, new Vector3(-3.15f, 0.52f, 1.92f), new Vector3(2.15f, 1.04f, 0.85f), new Color(0.28f, 0.27f, 0.22f, 1f), true);
            CreatePrimitive("RADIO", PrimitiveType.Cube, parent, new Vector3(-3.4f, 1.25f, 1.85f), new Vector3(0.62f, 0.38f, 0.28f), metalTone, false);
            CreatePrimitive("EXIT_DOOR", PrimitiveType.Cube, parent, new Vector3(3.78f, 1.25f, 2.80f), new Vector3(1.32f, 2.5f, 0.14f), new Color(0.19f, 0.13f, 0.10f, 1f), true);

            primaryBottle = CreatePrimitive("WATER_BOTTLE_PRIMARY", PrimitiveType.Cylinder, parent, new Vector3(-2.95f, 1.42f, 1.72f), new Vector3(0.22f, 0.34f, 0.22f), new Color(0.28f, 0.42f, 0.45f, 1f), false);
            reserveBottle = CreatePrimitive("WATER_BOTTLE_RESERVE", PrimitiveType.Cylinder, parent, new Vector3(-2.47f, 1.42f, 1.72f), new Vector3(0.22f, 0.34f, 0.22f), new Color(0.28f, 0.42f, 0.45f, 1f), false);
            cup = CreatePrimitive("EMPTY_CUP_AFTER_GIFT", PrimitiveType.Cylinder, parent, new Vector3(-3.38f, 1.17f, 1.66f), new Vector3(0.18f, 0.11f, 0.18f), new Color(0.58f, 0.55f, 0.45f, 1f), false);
            cup.SetActive(false);

            GameObject lampBody = CreatePrimitive("PRACTICAL_LAMP", PrimitiveType.Sphere, parent, new Vector3(0.4f, 2.55f, 0.3f), new Vector3(0.28f, 0.18f, 0.28f), new Color(0.69f, 0.57f, 0.34f, 1f), false);
            practicalLight = lampBody.AddComponent<Light>();
            practicalLight.type = LightType.Point;
            practicalLight.color = new Color(1f, 0.72f, 0.40f, 1f);
            practicalLight.range = 5.4f;
            practicalLight.intensity = 1.2f;
            practicalLight.shadows = LightShadows.Soft;
        }

        private static GameObject CreateCharacter(
            string name,
            Transform parent,
            Vector3 position,
            Color clothing,
            float idlePhase,
            out CharacterPresentation presentation)
        {
            GameObject root = new GameObject(name);
            root.transform.SetParent(parent, false);
            root.transform.position = position;

            GameObject visual = new GameObject("Visual");
            visual.transform.SetParent(root.transform, false);
            presentation = visual.AddComponent<CharacterPresentation>();
            presentation.Configure(idlePhase, 1f);

            Color skin = new Color(0.59f, 0.46f, 0.38f, 1f);
            Color trouser = new Color(clothing.r * 0.58f, clothing.g * 0.58f, clothing.b * 0.58f, 1f);
            Color shoe = new Color(0.10f, 0.095f, 0.085f, 1f);

            CreatePart("Torso", PrimitiveType.Capsule, visual.transform, new Vector3(0f, 1.28f, 0f), new Vector3(0.52f, 0.60f, 0.38f), clothing);
            CreatePart("Head", PrimitiveType.Sphere, visual.transform, new Vector3(0f, 2.05f, 0f), new Vector3(0.36f, 0.42f, 0.36f), skin);
            CreatePart("Leg_L", PrimitiveType.Capsule, visual.transform, new Vector3(-0.18f, 0.55f, 0f), new Vector3(0.18f, 0.43f, 0.18f), trouser);
            CreatePart("Leg_R", PrimitiveType.Capsule, visual.transform, new Vector3(0.18f, 0.55f, 0f), new Vector3(0.18f, 0.43f, 0.18f), trouser);
            CreatePart("Foot_L", PrimitiveType.Cube, visual.transform, new Vector3(-0.18f, 0.09f, -0.10f), new Vector3(0.28f, 0.14f, 0.56f), shoe);
            CreatePart("Foot_R", PrimitiveType.Cube, visual.transform, new Vector3(0.18f, 0.09f, -0.10f), new Vector3(0.28f, 0.14f, 0.56f), shoe);

            return root;
        }

        private static GameObject CreatePart(string name, PrimitiveType type, Transform parent, Vector3 localPosition, Vector3 localScale, Color tone)
        {
            GameObject part = GameObject.CreatePrimitive(type);
            part.name = name;
            part.transform.SetParent(parent, false);
            part.transform.localPosition = localPosition;
            part.transform.localScale = localScale;
            Collider collider = part.GetComponent<Collider>();
            if (collider != null) UnityEngine.Object.DestroyImmediate(collider);
            part.AddComponent<SurfaceTone>().Configure(tone);
            return part;
        }

        private static GameObject CreatePrimitive(
            string name,
            PrimitiveType type,
            Transform parent,
            Vector3 position,
            Vector3 scale,
            Color tone,
            bool keepCollider)
        {
            GameObject primitive = GameObject.CreatePrimitive(type);
            primitive.name = name;
            primitive.transform.SetParent(parent, false);
            primitive.transform.position = position;
            primitive.transform.localScale = scale;

            if (!keepCollider)
            {
                Collider collider = primitive.GetComponent<Collider>();
                if (collider != null) UnityEngine.Object.DestroyImmediate(collider);
            }

            primitive.AddComponent<SurfaceTone>().Configure(tone);
            return primitive;
        }
    }
}
