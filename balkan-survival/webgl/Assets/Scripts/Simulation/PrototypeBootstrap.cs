using UnityEngine;
using Slegnuce.Web;

namespace Slegnuce.Simulation
{
    public sealed class PrototypeBootstrap : MonoBehaviour
    {
#if UNITY_EDITOR || DEVELOPMENT_BUILD
        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        private static void AutoInstallForPrototype()
        {
            if (Object.FindFirstObjectByType<PrototypeBootstrap>() != null) return;
            new GameObject("SlegnucePrototypeBootstrap").AddComponent<PrototypeBootstrap>();
        }
#endif

        private void Awake()
        {
            SlegnuceWebBridge bridge = Object.FindFirstObjectByType<SlegnuceWebBridge>();
            if (bridge == null)
            {
                bridge = new GameObject("WebBridge").AddComponent<SlegnuceWebBridge>();
            }

            RunEngine engine = Object.FindFirstObjectByType<RunEngine>();
            if (engine == null)
            {
                engine = new GameObject("RunEngine").AddComponent<RunEngine>();
            }

            engine.SetBuild("unity-roundtrip-slice-0.1");
            engine.ConfigureScenarios(PrototypeScenarioFactory.CreateFirstSlice());
            engine.BindWebBridge(bridge);

            PrototypeShelterView view = Object.FindFirstObjectByType<PrototypeShelterView>();
            if (view == null)
            {
                view = new GameObject("PrototypeShelterView").AddComponent<PrototypeShelterView>();
            }
            view.Bind(engine);

            if (engine.State == null)
            {
                engine.StartNewRun("PRVI-REZ");
            }
        }
    }
}
