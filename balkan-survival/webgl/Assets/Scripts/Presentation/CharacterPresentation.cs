using UnityEngine;

namespace Slegnuce.Presentation
{
    public enum CharacterVisualState
    {
        Neutral,
        Watching,
        Cold,
        Relieved
    }

    public sealed class CharacterPresentation : MonoBehaviour
    {
        [SerializeField] private CharacterVisualState state = CharacterVisualState.Neutral;
        [SerializeField] private float phase;
        [SerializeField] private float idleAmplitude = 1f;

        private Vector3 baseLocalPosition;
        private Quaternion baseLocalRotation;

        public CharacterVisualState State => state;

        public void Configure(float idlePhase, float amplitude = 1f)
        {
            phase = idlePhase;
            idleAmplitude = Mathf.Max(0f, amplitude);
        }

        public void SetState(CharacterVisualState value)
        {
            state = value;
        }

        private void Awake()
        {
            baseLocalPosition = transform.localPosition;
            baseLocalRotation = transform.localRotation;
        }

        private void Update()
        {
            float t = Time.time + phase;
            float breathing = Mathf.Sin(t * 0.78f) * 0.0075f * idleAmplitude;
            float microSway = Mathf.Sin(t * 0.41f + 0.8f) * 0.65f * idleAmplitude;

            float lean = 0f;
            float stillness = 1f;
            switch (state)
            {
                case CharacterVisualState.Watching:
                    lean = 2.2f;
                    stillness = 0.55f;
                    break;
                case CharacterVisualState.Cold:
                    lean = 3.8f;
                    stillness = 0.35f;
                    break;
                case CharacterVisualState.Relieved:
                    lean = -1.2f;
                    stillness = 0.8f;
                    break;
            }

            transform.localPosition = baseLocalPosition + Vector3.up * breathing * stillness;
            transform.localRotation = baseLocalRotation * Quaternion.Euler(lean, 0f, microSway * stillness);
        }
    }
}
