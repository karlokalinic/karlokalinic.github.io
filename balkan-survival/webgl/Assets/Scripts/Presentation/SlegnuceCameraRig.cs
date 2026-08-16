using UnityEngine;

namespace Slegnuce.Presentation
{
    public sealed class SlegnuceCameraRig : MonoBehaviour
    {
        [SerializeField] private Camera viewCamera;
        [SerializeField] private Vector3 fixedPosition = new Vector3(8.8f, 7.4f, -11.6f);
        [SerializeField] private Vector3 lookAt = new Vector3(0f, 1.15f, 0.25f);
        [SerializeField, Range(18f, 38f)] private float fieldOfView = 26f;

        public Camera ViewCamera => viewCamera;

        public void Configure(Camera camera, Vector3 position, Vector3 target, float fov)
        {
            viewCamera = camera;
            fixedPosition = position;
            lookAt = target;
            fieldOfView = Mathf.Clamp(fov, 18f, 38f);
            Apply();
        }

        private void Awake()
        {
            if (viewCamera == null) viewCamera = GetComponent<Camera>();
            Apply();
        }

        private void Apply()
        {
            if (viewCamera == null) return;

            transform.position = fixedPosition;
            Vector3 direction = lookAt - fixedPosition;
            if (direction.sqrMagnitude > 0.001f)
            {
                transform.rotation = Quaternion.LookRotation(direction.normalized, Vector3.up);
            }

            viewCamera.orthographic = false;
            viewCamera.fieldOfView = fieldOfView;
            viewCamera.nearClipPlane = 0.1f;
            viewCamera.farClipPlane = 80f;
            viewCamera.clearFlags = CameraClearFlags.SolidColor;
            viewCamera.backgroundColor = new Color(0.055f, 0.059f, 0.052f, 1f);
            viewCamera.allowHDR = true;
        }
    }
}
