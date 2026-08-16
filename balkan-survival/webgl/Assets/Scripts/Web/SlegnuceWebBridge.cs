using System;
using System.Runtime.InteropServices;
using UnityEngine;

namespace Slegnuce.Web
{
    public sealed class SlegnuceWebBridge : MonoBehaviour
    {
        [Serializable]
        private struct ShellCommand
        {
            public string type;
            public string payload;
        }

#if UNITY_WEBGL && !UNITY_EDITOR
        [DllImport("__Internal")] private static extern void SlegnuceWeb_Emit(string eventType, string payload);
        [DllImport("__Internal")] private static extern void SlegnuceWeb_SaveRun(string payload);
        [DllImport("__Internal")] private static extern void SlegnuceWeb_SetCursor(string state);
#endif

        public static SlegnuceWebBridge Instance { get; private set; }
        public event Action<string, string> ShellCommandReceived;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }

            Instance = this;
            gameObject.name = "WebBridge";
            DontDestroyOnLoad(gameObject);
        }

        public void Emit(string eventType, string jsonPayload)
        {
#if UNITY_WEBGL && !UNITY_EDITOR
            SlegnuceWeb_Emit(eventType, jsonPayload ?? "{}");
#else
            Debug.Log($"[WebBridge] {eventType}: {jsonPayload}");
#endif
        }

        public void SaveRun(string jsonPayload)
        {
#if UNITY_WEBGL && !UNITY_EDITOR
            SlegnuceWeb_SaveRun(jsonPayload ?? "{}");
#else
            Debug.Log($"[WebBridge] SaveRun {jsonPayload}");
#endif
        }

        public void SetCursorState(string state)
        {
#if UNITY_WEBGL && !UNITY_EDITOR
            SlegnuceWeb_SetCursor(state ?? "normal");
#endif
        }

        public void ReceiveShellCommand(string json)
        {
            if (string.IsNullOrWhiteSpace(json)) return;
            var command = JsonUtility.FromJson<ShellCommand>(json);
            ShellCommandReceived?.Invoke(command.type, command.payload);
        }
    }
}
