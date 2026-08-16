using System;
using System.Collections.Generic;
using UnityEngine;

namespace Slegnuce.Simulation
{
    [Serializable]
    public sealed class CharacterRunState
    {
        public CharacterId id;
        public PresenceState presence;
        public int bond;
    }

    [Serializable]
    public sealed class RunLogEntry
    {
        public int scenarioIndex;
        public string scenarioId;
        public string choiceId;
        public string result;
    }

    [Serializable]
    public sealed class RunState
    {
        public string schema = "slegnuce.run/1";
        public string build = "unity-dev";
        public string seed;
        public int scenarioIndex;

        public int water = 7;
        public int food = 6;
        public int medicine = 1;
        public int information = 1;
        public int shelter = 2;
        public int stress = 2;

        public int prud = 2;
        public int tlak = 1;
        public int mostarina = 1;
        public int zavodniBon = 1;
        public int biljeg;

        public bool lied;
        public bool fraud;
        public bool bridgeKnown;
        public bool neighborHelped;
        public bool documentsBalanced;
        public bool medicineSecured;

        public List<CharacterRunState> characters = new List<CharacterRunState>();
        public List<RunLogEntry> log = new List<RunLogEntry>();

        public int Get(ResourceId id)
        {
            switch (id)
            {
                case ResourceId.Water: return water;
                case ResourceId.Food: return food;
                case ResourceId.Medicine: return medicine;
                case ResourceId.Information: return information;
                case ResourceId.Shelter: return shelter;
                case ResourceId.Stress: return stress;
                default: return 0;
            }
        }

        public int Get(TokenId id)
        {
            switch (id)
            {
                case TokenId.Prud: return prud;
                case TokenId.Tlak: return tlak;
                case TokenId.Mostarina: return mostarina;
                case TokenId.ZavodniBon: return zavodniBon;
                case TokenId.Biljeg: return biljeg;
                default: return 0;
            }
        }

        public void Add(ResourceId id, int delta)
        {
            switch (id)
            {
                case ResourceId.Water: water = Clamp(water + delta); break;
                case ResourceId.Food: food = Clamp(food + delta); break;
                case ResourceId.Medicine: medicine = Clamp(medicine + delta); break;
                case ResourceId.Information: information = Clamp(information + delta); break;
                case ResourceId.Shelter: shelter = Clamp(shelter + delta); break;
                case ResourceId.Stress: stress = Clamp(stress + delta); break;
            }
        }

        public void Add(TokenId id, int delta)
        {
            switch (id)
            {
                case TokenId.Prud: prud = Clamp(prud + delta); break;
                case TokenId.Tlak: tlak = Clamp(tlak + delta); break;
                case TokenId.Mostarina: mostarina = Clamp(mostarina + delta); break;
                case TokenId.ZavodniBon: zavodniBon = Clamp(zavodniBon + delta); break;
                case TokenId.Biljeg: biljeg = Clamp(biljeg + delta); break;
            }
        }

        public bool Get(FlagId id)
        {
            switch (id)
            {
                case FlagId.Lied: return lied;
                case FlagId.Fraud: return fraud;
                case FlagId.BridgeKnown: return bridgeKnown;
                case FlagId.NeighborHelped: return neighborHelped;
                case FlagId.DocumentsBalanced: return documentsBalanced;
                case FlagId.MedicineSecured: return medicineSecured;
                default: return false;
            }
        }

        public void Set(FlagId id, bool value)
        {
            switch (id)
            {
                case FlagId.Lied: lied = value; break;
                case FlagId.Fraud: fraud = value; break;
                case FlagId.BridgeKnown: bridgeKnown = value; break;
                case FlagId.NeighborHelped: neighborHelped = value; break;
                case FlagId.DocumentsBalanced: documentsBalanced = value; break;
                case FlagId.MedicineSecured: medicineSecured = value; break;
            }
        }

        public CharacterRunState Character(CharacterId id)
        {
            CharacterRunState found = characters.Find(x => x.id == id);
            if (found != null) return found;

            found = new CharacterRunState
            {
                id = id,
                presence = PresenceState.Absent,
                bond = 0
            };
            characters.Add(found);
            return found;
        }

        private static int Clamp(int value)
        {
            return Mathf.Clamp(value, 0, 99);
        }
    }
}
