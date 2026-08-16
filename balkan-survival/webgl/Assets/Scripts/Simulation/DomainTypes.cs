using System;

namespace Slegnuce.Simulation
{
    public enum CharacterId { None, Mira, Davor, Ena, Ivan }
    public enum PresenceState { Absent, Reachable, Active, Departed }
    public enum ResourceId { Water, Food, Medicine, Information, Shelter, Stress }
    public enum TokenId { Prud, Tlak, Mostarina, ZavodniBon, Biljeg }
    public enum FlagId { Lied, Fraud, BridgeKnown, NeighborHelped, DocumentsBalanced, MedicineSecured }
    public enum ConditionKind { ResourceAtLeast, TokenAtLeast, FlagIs, CharacterPresenceIs }
    public enum EffectKind { AddResource, AddToken, SetFlag, AddBond, SetPresence }

    [Serializable]
    public struct IntValue
    {
        public int value;
        public IntValue(int value) => this.value = value;
    }
}
