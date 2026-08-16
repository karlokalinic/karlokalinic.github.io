using System.Collections.Generic;
using UnityEngine;

namespace Slegnuce.Simulation
{
    public static class PrototypeScenarioFactory
    {
        public static List<ScenarioDefinition> CreateFirstSlice()
        {
            ScenarioDefinition scenario = ScriptableObject.CreateInstance<ScenarioDefinition>();
            scenario.name = "Scenario_Prototype_TwoLiters";
            scenario.id = "two_liters";
            scenario.time = "18:45";
            scenario.source = "HODNIK / IVAN";
            scenario.title = "DVIJE LITRE";
            scenario.body = "Ivan kuca tek kada je voda već postala predmet, a ne usluga. Kaže da mu dijete povraća i pita imaš li dvije litre. Sustav ne pita jesi li dobar čovjek; provjerava što stvarno imaš, tko je prisutan i što će nakon odgovora ostati zapisano.";
            scenario.quote = "‘Ne treba mi puno. Dvije litre. Samo da izdržimo noć.’";

            scenario.choices.Add(new ScenarioChoice
            {
                id = "give_two_liters",
                label = "DAJ 2 L VODE",
                detail = "Troši fizičku zalihu, stvara BILJEG i evidentira da je susjedu stvarno pomognuto.",
                resultText = "Dvije litre napuštaju stan. Zauzvrat ne dobivaš ‘dobrotu’, nego dokaz uzajamnosti koji se kasnije može vratiti kao BILJEG.",
                conditions = new List<ScenarioCondition>
                {
                    ResourceAtLeast(ResourceId.Water, 2)
                },
                effects = new List<ScenarioEffect>
                {
                    AddResource(ResourceId.Water, -2),
                    AddToken(TokenId.Biljeg, 1),
                    SetFlag(FlagId.NeighborHelped, true)
                }
            });

            scenario.choices.Add(new ScenarioChoice
            {
                id = "mira_ration",
                label = "MIRA: RAZDJELI 1 L I PREPIŠI PLAN",
                detail = "Postoji samo ako je Mira aktivna. Manja pomoć zahtijeva osobu koja zna preurediti ostatak kućne raspodjele.",
                carrier = CharacterId.Mira,
                resultText = "Mira daje jednu litru i istodobno mijenja plan raspodjele. Pomoć je manja, ali ostatak kućanstva prvi put dobiva precizniju informaciju o tome koliko stvarno ostaje.",
                conditions = new List<ScenarioCondition>
                {
                    ResourceAtLeast(ResourceId.Water, 1)
                },
                effects = new List<ScenarioEffect>
                {
                    AddResource(ResourceId.Water, -1),
                    AddResource(ResourceId.Information, 1),
                    AddToken(TokenId.Biljeg, 1),
                    SetFlag(FlagId.NeighborHelped, true),
                    AddBond(CharacterId.Mira, 1)
                }
            });

            scenario.choices.Add(new ScenarioChoice
            {
                id = "refuse_plainly",
                label = "ODBIJ BEZ LAŽI",
                detail = "Zaliha ostaje ista. Stres raste jer odluka ne nestaje samo zato što ništa nije predano.",
                resultText = "Ivan odlazi bez vode. Nema lažne činjenice koju kasnije treba braniti, ali odbijanje ostaje događaj i povećava napetost u stanu.",
                effects = new List<ScenarioEffect>
                {
                    AddResource(ResourceId.Stress, 1)
                }
            });

            scenario.choices.Add(new ScenarioChoice
            {
                id = "claim_no_water",
                label = "RECI DA NEMA VODE",
                detail = "Ne troši fizički resurs. Stvara flag koji kasniji događaj može provjeravati protiv drugih dokaza.",
                resultText = "Voda ostaje kod tebe, ali run sada sadrži tvrdnju koja može doći u sukob s onim što drugi ljudi vide ili pamte.",
                effects = new List<ScenarioEffect>
                {
                    SetFlag(FlagId.Lied, true),
                    AddResource(ResourceId.Stress, 1)
                }
            });

            return new List<ScenarioDefinition> { scenario };
        }

        private static ScenarioCondition ResourceAtLeast(ResourceId id, int minimum)
        {
            return new ScenarioCondition
            {
                kind = ConditionKind.ResourceAtLeast,
                resource = id,
                minimum = minimum
            };
        }

        private static ScenarioEffect AddResource(ResourceId id, int amount)
        {
            return new ScenarioEffect
            {
                kind = EffectKind.AddResource,
                resource = id,
                amount = amount
            };
        }

        private static ScenarioEffect AddToken(TokenId id, int amount)
        {
            return new ScenarioEffect
            {
                kind = EffectKind.AddToken,
                token = id,
                amount = amount
            };
        }

        private static ScenarioEffect SetFlag(FlagId id, bool value)
        {
            return new ScenarioEffect
            {
                kind = EffectKind.SetFlag,
                flag = id,
                flagValue = value
            };
        }

        private static ScenarioEffect AddBond(CharacterId id, int amount)
        {
            return new ScenarioEffect
            {
                kind = EffectKind.AddBond,
                character = id,
                amount = amount
            };
        }
    }
}
