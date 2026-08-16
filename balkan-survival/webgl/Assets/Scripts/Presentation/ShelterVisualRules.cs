using Slegnuce.Simulation;

namespace Slegnuce.Presentation
{
    public struct ShelterVisualState
    {
        public bool primaryWaterVisible;
        public bool reserveWaterVisible;
        public bool emptyCupVisible;
        public CharacterVisualState neighborState;
        public float practicalLightIntensity;
    }

    public static class ShelterVisualRules
    {
        public static ShelterVisualState Evaluate(RunState state)
        {
            if (state == null)
            {
                return new ShelterVisualState
                {
                    neighborState = CharacterVisualState.Neutral,
                    practicalLightIntensity = 1.15f
                };
            }

            return new ShelterVisualState
            {
                primaryWaterVisible = state.water > 0,
                reserveWaterVisible = state.water >= 7,
                emptyCupVisible = state.neighborHelped,
                neighborState = state.neighborHelped ? CharacterVisualState.Relieved : CharacterVisualState.Watching,
                practicalLightIntensity = state.neighborHelped ? 1.45f : 1.2f
            };
        }
    }
}
