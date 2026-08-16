using UnityEngine;

namespace Slegnuce.Presentation
{
    public sealed class SurfaceTone : MonoBehaviour
    {
        [SerializeField] private Color tone = Color.gray;
        private readonly MaterialPropertyBlock block = new MaterialPropertyBlock();

        public void Configure(Color value)
        {
            tone = value;
            Apply();
        }

        private void Awake()
        {
            Apply();
        }

        private void Apply()
        {
            Renderer[] renderers = GetComponentsInChildren<Renderer>(true);
            foreach (Renderer renderer in renderers)
            {
                renderer.GetPropertyBlock(block);
                block.SetColor("_Color", tone);
                block.SetColor("_BaseColor", tone);
                renderer.SetPropertyBlock(block);
            }
        }
    }
}
