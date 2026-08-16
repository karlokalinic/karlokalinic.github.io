using UnityEngine;
using Slegnuce.Simulation;
using Slegnuce.Interaction;

namespace Slegnuce.Presentation
{
    public sealed class ShelterPresentationController : MonoBehaviour
    {
        [SerializeField] private GameObject primaryWaterBottle;
        [SerializeField] private GameObject reserveWaterBottle;
        [SerializeField] private GameObject emptyCup;
        [SerializeField] private CharacterPresentation neighborCharacter;
        [SerializeField] private Light practicalLight;

        private RunEngine engine;

        public void Configure(
            GameObject primaryBottle,
            GameObject reserveBottle,
            GameObject cup,
            CharacterPresentation neighbor,
            Light lamp)
        {
            primaryWaterBottle = primaryBottle;
            reserveWaterBottle = reserveBottle;
            emptyCup = cup;
            neighborCharacter = neighbor;
            practicalLight = lamp;
        }

        public void Bind(RunEngine value)
        {
            if (engine == value) return;
            if (engine != null) engine.StateChanged -= HandleStateChanged;

            engine = value;
            if (engine != null)
            {
                engine.StateChanged += HandleStateChanged;
                foreach (ScenarioInteractionBinding interaction in GetComponentsInChildren<ScenarioInteractionBinding>(true))
                {
                    interaction.Bind(engine);
                }
                Apply(engine.State);
            }
        }

        private void OnDestroy()
        {
            if (engine != null) engine.StateChanged -= HandleStateChanged;
        }

        private void HandleStateChanged(RunState state)
        {
            Apply(state);
        }

        private void Apply(RunState state)
        {
            ShelterVisualState visual = ShelterVisualRules.Evaluate(state);

            if (primaryWaterBottle != null) primaryWaterBottle.SetActive(visual.primaryWaterVisible);
            if (reserveWaterBottle != null) reserveWaterBottle.SetActive(visual.reserveWaterVisible);
            if (emptyCup != null) emptyCup.SetActive(visual.emptyCupVisible);
            if (neighborCharacter != null) neighborCharacter.SetState(visual.neighborState);
            if (practicalLight != null) practicalLight.intensity = visual.practicalLightIntensity;
        }
    }
}
