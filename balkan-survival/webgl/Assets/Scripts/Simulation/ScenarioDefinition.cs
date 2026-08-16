using System;
using System.Collections.Generic;
using UnityEngine;

namespace Slegnuce.Simulation
{
    [Serializable]
    public sealed class ScenarioCondition
    {
        public ConditionKind kind;
        public ResourceId resource;
        public TokenId token;
        public FlagId flag;
        public CharacterId character;
        public PresenceState presence = PresenceState.Active;
        public int minimum = 1;
        public bool expectedFlag = true;
    }

    [Serializable]
    public sealed class ScenarioEffect
    {
        public EffectKind kind;
        public ResourceId resource;
        public TokenId token;
        public FlagId flag;
        public CharacterId character;
        public PresenceState presence;
        public int amount;
        public bool flagValue = true;
    }

    [Serializable]
    public sealed class ScenarioChoice
    {
        public string id;
        public string label;
        [TextArea] public string detail;
        public CharacterId carrier = CharacterId.None;
        public List<ScenarioCondition> conditions = new List<ScenarioCondition>();
        public List<ScenarioEffect> effects = new List<ScenarioEffect>();
        [TextArea] public string resultText;
    }

    [CreateAssetMenu(menuName = "Slegnuce/Scenario Definition", fileName = "Scenario_")]
    public sealed class ScenarioDefinition : ScriptableObject
    {
        public string id;
        public string time;
        public string source;
        public string title;
        [TextArea(3, 8)] public string body;
        [TextArea(2, 5)] public string quote;
        public List<ScenarioChoice> choices = new List<ScenarioChoice>();
    }
}
