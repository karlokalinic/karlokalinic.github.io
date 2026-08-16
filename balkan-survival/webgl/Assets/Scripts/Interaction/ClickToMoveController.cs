using UnityEngine;

namespace Slegnuce.Interaction
{
    public sealed class ClickToMoveController : MonoBehaviour
    {
        [SerializeField] private Camera viewCamera;
        [SerializeField] private float movementSpeed = 2.35f;
        [SerializeField] private float turnSpeed = 9f;
        [SerializeField] private float interactionDistance = 0.72f;
        [SerializeField] private Vector2 xBounds = new Vector2(-4.15f, 4.15f);
        [SerializeField] private Vector2 zBounds = new Vector2(-2.55f, 2.35f);

        private Vector3 destination;
        private bool hasDestination;
        private ScenarioInteractionBinding pendingInteraction;

        public void Configure(Camera camera, float speed, Vector2 horizontalBounds, Vector2 depthBounds)
        {
            viewCamera = camera;
            movementSpeed = Mathf.Max(0.1f, speed);
            xBounds = horizontalBounds;
            zBounds = depthBounds;
            destination = transform.position;
        }

        private void Awake()
        {
            if (viewCamera == null) viewCamera = Camera.main;
            destination = transform.position;
        }

        private void Update()
        {
            ReadPointer();
            Move();
        }

        private void ReadPointer()
        {
            if (viewCamera == null || !Input.GetMouseButtonDown(0)) return;

            Ray ray = viewCamera.ScreenPointToRay(Input.mousePosition);
            RaycastHit hit;
            if (!Physics.Raycast(ray, out hit, 100f)) return;

            ScenarioInteractionBinding interaction = hit.collider.GetComponentInParent<ScenarioInteractionBinding>();
            if (interaction != null)
            {
                pendingInteraction = interaction;
                SetDestination(interaction.InteractionAnchor.position);
                return;
            }

            if (hit.collider.CompareTag("Respawn"))
            {
                pendingInteraction = null;
                SetDestination(hit.point);
            }
        }

        private void SetDestination(Vector3 point)
        {
            destination = new Vector3(
                Mathf.Clamp(point.x, xBounds.x, xBounds.y),
                transform.position.y,
                Mathf.Clamp(point.z, zBounds.x, zBounds.y));
            hasDestination = true;
        }

        private void Move()
        {
            if (!hasDestination) return;

            Vector3 delta = destination - transform.position;
            delta.y = 0f;
            float distance = delta.magnitude;
            float stopDistance = pendingInteraction != null ? interactionDistance : 0.04f;

            if (distance <= stopDistance)
            {
                hasDestination = false;
                ScenarioInteractionBinding interaction = pendingInteraction;
                pendingInteraction = null;
                if (interaction != null) interaction.TryExecute();
                return;
            }

            Vector3 direction = delta / Mathf.Max(distance, 0.0001f);
            transform.position += direction * Mathf.Min(movementSpeed * Time.deltaTime, distance);

            if (direction.sqrMagnitude > 0.001f)
            {
                Quaternion desired = Quaternion.LookRotation(direction, Vector3.up);
                transform.rotation = Quaternion.Slerp(transform.rotation, desired, 1f - Mathf.Exp(-turnSpeed * Time.deltaTime));
            }
        }
    }
}
