/* scripts/main.js */
import { Pf2eAdapter } from "./pf2e.js";
import * as Config from "./sf2e-config.js";
import * as Utils from "./sf2e-utils.js";

/**
 * Adaptador de Sistema para Starfinder 2e
 * Atua como uma ponte (bridge) sobre o motor do PF2e
 */
class Starfinder2eAdapter extends Pf2eAdapter {
    constructor() {
        super();
        this.systemId = "sf2e";
    }

    // Atributos principais na barra do HUD (Party HUD / Player Card)
    getDefaultAttributes() {
        return [
            { path: "system.attributes.hp", label: "HP", color: "#e61c34", style: "bar", icon: "ra ra-health" },
            { path: "system.attributes.sp", label: "SP", color: "#18d4f3", style: "bar", icon: "ra ra-lightning-bolt" },
            { path: "system.attributes.ac.value", label: "AC", color: "#ffffff", style: "badge", icon: "ra ra-shield" },
            { path: "system.resources.rp", label: "RP", color: "#9d4edd", style: "badge", icon: "ra ra-atom", badgeScale: 1.0 },
        ];
    }

    // Adiciona atributos rastreáveis específicos do SF2e
    getTrackableAttributes(actor) {
        const stats = super.getTrackableAttributes(actor);
        const s = actor.system;

        if (s.attributes?.sp) {
            stats.push({ path: "system.attributes.sp", label: "Stamina Points (SP)" });
        }
        if (s.resources?.rp) {
            stats.push({ path: "system.resources.rp", label: "Resolve Points (RP)", style: "badge", icon: "ra ra-atom", color: "#9d4edd" });
        }
        stats.sort((a, b) => a.label.localeCompare(b.label));
        return stats;
    }

    /* -----------------------------------------
       INVENTORY
       ----------------------------------------- */
    _getInventoryData(actor) {
        const categories = {
            weapon: { label: `${game.i18n.localize("IBHUD.Pf2e.InvWeapons") || "Weapons"}      <i class='ra ra-crossed-swords' style='margin-left: 8px;'></i>`, tooltip: game.i18n.localize("IBHUD.Pf2e.InvWeapons") || "Weapons" },
            armor: { label: `${game.i18n.localize("IBHUD.Pf2e.InvArmor") || "Armor"}         <i class='ra ra-shield'         style='margin-left: 8px;'></i>`, tooltip: game.i18n.localize("IBHUD.Pf2e.InvArmor") || "Armor" },
            augmentation: { label: `Augmentations <i class='ra ra-pulse'               style='margin-left: 8px;'></i>`, tooltip: "Augmentations (Cybernetics & Biotech)" },
            upgrade: { label: `Upgrades      <i class='ra ra-cog'                 style='margin-left: 8px;'></i>`, tooltip: "Armor Upgrades & Weapon Fusions" },
            consumable: { label: `${game.i18n.localize("IBHUD.Pf2e.InvConsumables") || "Consumables"}   <i class='ra ra-potion'         style='margin-left: 8px;'></i>`, tooltip: game.i18n.localize("IBHUD.Pf2e.InvConsumables") || "Consumables" },
            equipment: { label: `${game.i18n.localize("IBHUD.Pf2e.InvEquipment") || "Equipment"}     <i class='ra ra-gear-hammer'    style='margin-left: 8px;'></i>`, tooltip: game.i18n.localize("IBHUD.Pf2e.InvEquipment") || "Equipment" },
            treasure: { label: `${game.i18n.localize("IBHUD.Pf2e.InvTreasure") || "Treasure"}      <i class='ra ra-gem'            style='margin-left: 8px;'></i>`, tooltip: game.i18n.localize("IBHUD.Pf2e.InvTreasure") || "Treasure" },
            backpack: { label: `${game.i18n.localize("IBHUD.Pf2e.InvContainers") || "Containers"}    <i class='ra ra-backpack'       style='margin-left: 8px;'></i>`, tooltip: game.i18n.localize("IBHUD.Pf2e.InvContainers") || "Containers" },
            ammo: { label: `Ammunition    <i class='ra ra-bullets'             style='margin-left: 8px;'></i>`, tooltip: "Ammunition" },
        };

        const items = {};
        const primaryLabels = {};
        const primaryTooltips = {};
        const subLabels = {};

        Object.keys(categories).forEach((key) => {
            items[key] = { all: [] };
            primaryLabels[key] = categories[key].label;
            primaryTooltips[key] = "";
            subLabels[key] = { all: "All Items" };
        });

        const physicalItems = actor.items.filter((i) =>
            ["weapon", "armor", "consumable", "equipment", "treasure", "backpack", "ammo", "augmentation", "upgrade"].includes(i.type)
        );

        physicalItems.forEach((i) => {
            const type = i.type;
            if ((type === "consumable" || type === "treasure") && i.quantity <= 0) return;

            const actionButtons = this._getInventoryActionButtons(i);
            const quantityHtml = `<span style="font-family:'Teko'; font-size:1.1em; color:var(--g-accent);">x${i.quantity}</span>`;

            const listItem = {
                id: i.id,
                name: i.name,
                img: i.img || "icons/svg/item-bag.svg",
                hasInlineControls: Boolean(actionButtons),
                cost: actionButtons
                    ? `<div style="display:flex; align-items:flex-start; gap:6px; flex-wrap:wrap; justify-content:flex-end; max-width:180px; row-gap:5px;">${quantityHtml}${actionButtons}</div>`
                    : quantityHtml,
                description: i.system.description?.value || "",
            };

            if (items[type]) items[type]["all"].push(listItem);
        });

        Object.keys(items).forEach((key) => {
            if (items[key]["all"].length === 0) {
                delete items[key];
                delete primaryLabels[key];
                delete primaryTooltips[key];
                delete subLabels[key];
            } else {
                items[key]["all"].sort((a, b) => a.name.localeCompare(b.name));
            }
        });

        return {
            title: "INVENTORY",
            theme: "red",
            hasTabs: true,
            hasSubTabs: true,
            items,
            tabLabels: primaryLabels,
            tabTooltips: primaryTooltips,
            subTabLabels: subLabels,
        };
    }

    _getInventoryActionButtons(item) {
        const equipped = item.system?.equipped || {};
        const carryType = String(equipped.carryType || "stowed");
        const handsHeld = Number(equipped.handsHeld ?? 0);
        const inSlot = Boolean(equipped.inSlot);
        const invested = Boolean(equipped.invested);
        const usageValue = String(item.system?.usage?.value ?? item.system?.usage ?? "").toLowerCase();
        const canGrip = ["weapon", "armor", "equipment", "consumable", "treasure", "backpack", "augmentation"].includes(item.type);
        const canWear = ["weapon", "armor", "equipment", "consumable", "treasure", "backpack", "augmentation"].includes(item.type) || usageValue.includes("worn");
        const canInvest = Array.isArray(item.system?.traits?.value) && item.system.traits.value.includes("invested");
        const isArmorWorn = item.type === "armor" && carryType === "worn" && inSlot;
        const isHeld1 = carryType === "held" && handsHeld <= 1;
        const isHeld2 = carryType === "held" && handsHeld >= 2;
        const isWorn = carryType === "worn" && !isArmorWorn;
        const isStowed = carryType === "stowed";
        const isDropped = carryType === "dropped";
        const isHeld = carryType === "held";

        const options = [];
        const localize = (key, fallback) => { const t = game.i18n.localize(key); return (t && t !== key) ? t : fallback; };

        const verb = isHeld ? localize("IBHUD.Pf2e.ActionGrip", "Grip") : localize("IBHUD.Pf2e.ActionDraw", "Draw");
        const handsLabel1 = localize("IBHUD.Pf2e.ActionGrip1", "1H");
        const handsLabel2 = localize("IBHUD.Pf2e.ActionGrip2", "2H");

        const addOption = (id, label, iconHtml, active = false) => options.push({ id, label, iconHtml, active });

        if (canGrip) {
            addOption("grip1", `${verb} ${handsLabel1}`, this._getInventoryCarryIconHtml("held", 1), isHeld1);
            addOption("grip2", `${verb} ${handsLabel2}`, this._getInventoryCarryIconHtml("held", 2), isHeld2);
        }
        if (item.type === "armor") {
            addOption("wearArmor", game.i18n.localize("IBHUD.Pf2e.ActionWearArmor"), this._getInventoryCarryIconHtml("worn-armor", 0), isArmorWorn);
        }
        if (canWear) {
            addOption("wear", game.i18n.localize("IBHUD.Pf2e.ActionWear"), this._getInventoryCarryIconHtml("worn", 0), isWorn);
        }
        addOption("stow", game.i18n.localize("IBHUD.Pf2e.ActionStow"), this._getInventoryCarryIconHtml("stowed", 0), isStowed);
        addOption("dropped", game.i18n.localize("IBHUD.Pf2e.ActionDrop"), this._getInventoryCarryIconHtml("dropped", 0), isDropped);

        if (canInvest) {
            options.push({
                id: "invest",
                label: `${game.i18n.localize("IBHUD.Pf2e.ActionInvest")}${invested ? " ✓" : ""}`,
                iconHtml: `<i class="fas fa-gem"></i>`,
                active: invested,
            });
        }

        const carryStateLabel = carryType === "held"
            ? `${localize("IBHUD.Pf2e.ActionHeld", "Held")} ${handsHeld >= 2 ? handsLabel2 : handsLabel1}`
            : carryType === "worn"
                ? (isArmorWorn ? localize("IBHUD.Pf2e.ActionWearArmor", "Wear Armor") : localize("IBHUD.Pf2e.ActionWear", "Wear"))
                : carryType === "dropped"
                    ? localize("IBHUD.Pf2e.ActionDrop", "Drop")
                    : localize("IBHUD.Pf2e.ActionStow", "Stow");

        return this._buildInventoryManageButton(item.id, carryType, handsHeld, carryStateLabel, options);
    }

    /**
     * Sobrescreve a criação de Strikes para usar as cores do Starfinder 2e.
     */
    _createStrikeItem(s) {
        const isUnarmed = s.item?.type === "unarmed" || s.item?.slug === "unarmed" || s.item?.system?.category === "unarmed" || s.traits?.some(t => (t.value || t) === "unarmed");
        const isHeld = s.item?.system?.equipped?.carryType === "held";
        const isReady = isHeld || isUnarmed;

        const ammoHtml = this._buildAmmoRowHtml(s);

        let traitsHtml = "";
        if (s.traits?.length > 0) {
            traitsHtml = `<div style="display:flex; gap:2px; flex-wrap:wrap; margin-top:2px;">`;
            s.traits.forEach(t => {
                traitsHtml += `<span style="font-size:0.65em; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:2px; padding:0 3px; color:#999; line-height:1.2;" title="${t.description || ''}">${t.label}</span>`;
            });
            traitsHtml += `</div>`;
        }

        let auxHtml = "";
        if (s.auxiliaryActions?.length > 0) {
            auxHtml = `<div style="display:flex; gap:3px; flex-wrap:wrap; margin-top:2px;">`;
            s.auxiliaryActions.forEach((aux, idx) => {
                const glyph = this._getActionGlyph(aux.actionCost || 1);
                auxHtml += `
                    <button type="button"
                        onclick="event.stopPropagation(); StylishAction.useItem('${s.item.id}_auxiliary_${idx}')"
                        title="${aux.label}"
                        style="background:rgba(40, 60, 80, 0.6); border:1px solid #468; color:#adf; border-radius:3px; padding:1px 5px; font-size:0.75em; cursor:pointer; line-height:1.1; display:flex; align-items:center; gap:2px;"
                        onmouseover="this.style.background='#468'; this.style.color='#fff';"
                        onmouseout="this.style.background='rgba(40, 60, 80, 0.6)'; this.style.color='#adf';">
                        ${glyph} <span style="font-family:'Oswald',sans-serif;">${aux.label}</span>
                    </button>`;
            });
            auxHtml += `</div>`;
        }

        let buttonsHtml = "";
        if (isReady) {
            buttonsHtml = `<div style="display:flex; gap:3px; flex-wrap:wrap; margin-top:2px;">`;
            s.variants.forEach((v, idx) => {
                const opacity = idx === 0 ? "1.0" : idx === 1 ? "0.8" : "0.6";
                buttonsHtml += `
                        <button type="button" class="pf2e-map-btn"
                            onclick="event.stopPropagation(); StylishAction.useItem('${s.item.id}_attack_${idx}')"
                            title="${idx === 0 ? "1st Attack" : idx === 1 ? "2nd Attack (MAP)" : "3rd Attack (MAP)"}"
                            style="background: rgba(64, 37, 111, ${opacity}); border: 1px solid #00d2ff; color: #fff; border-radius: 3px; padding: 1px 6px; font-size: 0.85em; font-family: 'Oswald', sans-serif; cursor: pointer; line-height: 1.2; min-width: 32px; text-align: center; text-transform: uppercase; transition: all 0.2s ease;"
                            onmouseover="this.style.background='#00d2ff'; this.style.color='#000'; this.style.boxShadow='0 0 8px #00d2ff';"
                            onmouseout="this.style.background='rgba(64, 37, 111, ${opacity})'; this.style.color='#fff'; this.style.boxShadow='none';"
                        >${v.label}</button>`;
            });

            buttonsHtml += `
                    <button type="button" class="pf2e-dmg-btn"
                        onclick="event.stopPropagation(); StylishAction.useItem('${s.item.id}_damage')"
                        title="Click: Damage / Ctrl+Click: Critical"
                        style="background: rgba(100, 20, 20, 0.8); border: 1px solid #d44; color: #faa; border-radius: 3px; padding: 1px 6px; font-size: 0.85em; cursor: pointer; line-height: 1.2; margin-left: 2px;"
                        onmouseover="this.style.background='#d44'; this.style.color='#fff';"
                        onmouseout="this.style.background='rgba(100, 20, 20, 0.8)'; this.style.color='#faa';"
                    ><i class="ra ra-dripping-blade"></i> <i class="ra ra-dice-six"></i></button>
                </div>`;
        }

        let altButtonsHtml = "";
        if (s.altUsages?.length > 0) {
            s.altUsages.forEach((alt, altIdx) => {
                if (!alt.variants?.length) return;
                altButtonsHtml += `<div style="display:flex; gap:3px; flex-wrap:wrap; margin-top:2px;">`;
                alt.variants.forEach((v, idx) => {
                    const opacity = idx === 0 ? "1.0" : idx === 1 ? "0.8" : "0.6";
                    altButtonsHtml += `
                        <button type="button" class="pf2e-map-btn"
                            onclick="event.stopPropagation(); StylishAction.useItem('${s.item.id}_altattack_${altIdx}_${idx}')"
                            style="background: rgba(64, 37, 111, ${opacity}); border: 1px solid #00d2ff; color: #fff; border-radius: 3px; padding: 1px 6px; font-size: 0.85em; font-family: 'Oswald', sans-serif; cursor: pointer; line-height: 1.2; min-width: 32px; text-align: center; text-transform: uppercase; transition: all 0.2s ease;"
                            onmouseover="this.style.background='#00d2ff'; this.style.color='#000'; this.style.boxShadow='0 0 8px #00d2ff';"
                            onmouseout="this.style.background='rgba(64, 37, 111, ${opacity})'; this.style.color='#fff'; this.style.boxShadow='none';"
                        >${v.label}</button>`;
                });
                altButtonsHtml += `
                    <button type="button" class="pf2e-dmg-btn"
                        onclick="event.stopPropagation(); StylishAction.useItem('${s.item.id}_altdamage_${altIdx}')"
                        style="background: rgba(100, 20, 20, 0.8); border: 1px solid #d44; color: #faa; border-radius: 3px; padding: 1px 6px; font-size: 0.85em; cursor: pointer; line-height: 1.2; margin-left: 2px;"
                        onmouseover="this.style.background='#d44'; this.style.color='#fff';"
                        onmouseout="this.style.background='rgba(100, 20, 20, 0.8)'; this.style.color='#faa';"
                    ><i class="ra ra-dripping-blade"></i> <i class="ra ra-dice-six"></i></button>
                </div>`;
            });
        }

        const mainOpacity = isReady ? "1.0" : "0.55";
        const unequippedLabel = !isReady ? `<span style="font-size:0.8em; color:#aaa; font-style:italic; margin-left:5px;">(${game.i18n.localize("IBHUD.Pf2e.ActionUnequipped") || "Unequipped"})</span>` : "";

        const layoutHtml = `
                <div style="display:flex; flex-direction:column; align-items:flex-start; justify-content:center; opacity:${mainOpacity};">
                    <span style="font-size:1.05em; font-weight:bold; color:#fff; line-height:1.2; text-shadow: 1px 1px 2px rgba(0,0,0,0.8); text-transform: uppercase; font-family: 'Oswald', sans-serif;">
                        ${s.label}${unequippedLabel}
                    </span>
					${traitsHtml}${ammoHtml}${buttonsHtml}${auxHtml}${altButtonsHtml}
                </div>`;

        return {
            id: s.item.id,
            name: layoutHtml,
            title: "",
            img: s.imageUrl || s.item?.img || "icons/svg/d20.svg",
            cost: "",
            description: s.description || s.damageLabel || "Strike",
        };
    }

    /**
     * Sobrescreve Elemental Blast para usar cores do Starfinder 2e.
     */
    _createElementalBlastItem(elementalBlast, config) {
        const element = config.element;
        const damageTypes = config.damageTypes || [];
        const label = `Elemental Blast (${element})`;
        const img = elementalBlast.item?.img || "icons/svg/fire.svg";

        let buttonsHtml = `<div style="display:flex; gap:3px; flex-wrap:wrap; margin-top:2px;">`;
        const blastId = `blast_${element}_${damageTypes[0]?.value || "untyped"}`;
        const maps = config.maps?.melee ?? config.maps?.ranged ?? null;

        [0, 1, 2].forEach((idx) => {
            const opacity = idx === 0 ? "1.0" : idx === 1 ? "0.8" : "0.6";
            const mapLabel = maps ? (idx === 0 ? maps.map0 : idx === 1 ? maps.map1 : maps.map2) : (idx === 0 ? "+0" : idx === 1 ? "-4" : "-8");
            buttonsHtml += `
                <button type="button" class="pf2e-map-btn"
                    onclick="event.stopPropagation(); StylishAction.useItem('${blastId}_attack_${idx}')"
                    style="background: rgba(64, 37, 111, ${opacity}); border: 1px solid #00d2ff; color: #fff; border-radius: 3px; padding: 1px 6px; font-size: 0.85em; font-family: 'Oswald', sans-serif; cursor: pointer; line-height: 1.2; min-width: 32px; text-align: center; text-transform: uppercase; transition: all 0.2s ease;"
                    onmouseover="this.style.background='#00d2ff'; this.style.color='#000'; this.style.boxShadow='0 0 8px #00d2ff';"
                    onmouseout="this.style.background='rgba(64, 37, 111, ${opacity})'; this.style.color='#fff'; this.style.boxShadow='none';"
                >${mapLabel}</button>`;
        });

        buttonsHtml += `
            <button type="button" class="pf2e-dmg-btn"
                onclick="event.stopPropagation(); StylishAction.useItem('${blastId}_damage')"
                style="background: rgba(100, 20, 20, 0.8); border: 1px solid #d44; color: #faa; border-radius: 3px; padding: 1px 6px; font-size: 0.85em; cursor: pointer; line-height: 1.2; margin-left: 2px;"
                onmouseover="this.style.background='#d44'; this.style.color='#fff';"
                onmouseout="this.style.background='rgba(100, 20, 20, 0.8)'; this.style.color='#faa';"
            ><i class="ra ra-dripping-blade"></i> <i class="ra ra-dice-six"></i></button>
        </div>`;

        const layoutHtml = `
			<div style="display:flex; flex-direction:column; align-items:flex-start; justify-content:center;">
				<span style="font-size:1.05em; font-weight:bold; color:#fff; line-height:1.2; text-transform: uppercase; font-family: 'Oswald', sans-serif;">${label}</span>
				${buttonsHtml}
			</div>`;

        return {
            id: blastId,
            name: layoutHtml,
            title: "",
            img: img,
            cost: "",
            description: `${element} Elemental Blast`,
            isElementalBlast: true,
            blastConfig: config,
        };
    }

    /**
     * Remove tooltips redundantes das abas de magia.
     */
    async _getSpellData(actor) {
        const data = await super._getSpellData(actor);
        if (data.tabTooltips) {
            Object.keys(data.tabTooltips).forEach(k => data.tabTooltips[k] = "");
        }
        return data;
    }

    /**
     * Remove tooltips redundantes das abas de talentos (Feats).
     */
    _getFeatData(actor) {
        const data = super._getFeatData(actor);
        data.tabTooltips = { action: "", reaction: "", free: "" };
        return data;
    }

    /**
     * Injeta as utilidades mantendo os Saves, Toggles e Macros nativos.
     */
    _getUtilityData(actor) {
        const data = super._getUtilityData(actor);

        // Remove tooltips redundantes dos menus laterais (Saves, Skills, etc)
        if (data.tabTooltips) {
            Object.keys(data.tabTooltips).forEach(k => data.tabTooltips[k] = "");
        }

        // 1. Limpeza e sub-aba Lore para Skills
        if (data.items?.skill) {
            if (data.items.skill.all) {
                data.items.skill.all.forEach(item => {
                    if (item.name) item.name = item.name.replace(/\s*\(P?S?F2E\.Skill\.[^)]+\)/gi, "");
                    item.img = item.img || "icons/svg/d20.svg";
                });
            }

            data.items.skill.lore = [];
            actor.itemTypes.lore.forEach(lore => {
                const mod = lore.system.check?.mod ?? lore.system.mod?.value ?? 0;
                data.items.skill.lore.push({
                    id: `skill-${lore.slug || lore.id}`,
                    name: lore.name,
                    img: lore.img || "icons/svg/d20.svg",
                    cost: `${mod >= 0 ? "+" : ""}${mod}`,
                    description: game.i18n.format("PF2E.SkillCheckWithName", { skillName: lore.name })
                });
            });

            if (!data.subTabLabels.skill) data.subTabLabels.skill = {};
            data.subTabLabels.skill = {
                all: `Skills <i class='ra ra-dice-six' style='margin-left: 10px;'></i>`,
                lore: `Lore <i class='ra ra-scroll' style='margin-left: 10px;'></i>`
            };
            data.items.skill.lore.sort((a, b) => a.name.localeCompare(b.name));
        }

        // 2. Resolve Points utility
        if (data.items?.other?.all) {
            data.items.other.all.push({
                id: "sf2e-util:use-resolve",
                name: "Use Resolve Points",
                img: "icons/svg/d20.svg",
                cost: "RP",
                description: "Spend Resolve Points for stamina recovery or stabilization."
            });
        }

        return data;
    }

    /**
     * Corrige nomes de ações, injeta ícones customizados e garante que ações não
     * registradas nativamente pelo SF2 apareçam no HUD via injeção manual.
     *
     * Organização baseada no GM Core Screen do Starfinder 2e.
     */
    async _getActionData(actor) {
        // ── Encounter ──────────────────────────────────────────────────────────────
        const slugsAttack = [
            'strike', 'escape', 'disarm', 'grapple', 'shove', 'trip',
            'reposition', 'feint', 'area-fire', 'auto-fire', 'steal', 'reactive-strike', 'force-open'
        ];
        const slugsMovement = [
            'stride', 'step', 'stand', 'crawl', 'leap', 'drop-prone', 'fly', 'burrow'
        ];
        const slugsInteractPercept = [
            'interact', 'seek', 'sense-motive', 'point-out'
        ];
        const slugsDefenseSupport = [
            'take-cover', 'raise-a-shield', 'avert-gaze', 'ready', 'aid', 'arrest-a-fall', 'grab-an-edge'
        ];
        const slugsSpecialty = [
            'mount', 'push-off', 'dismiss', 'sustain', 'recharge', 'operate-device'
        ];
        // Skill Actions (Encounter) — inclui PF2 e SF2
        const slugsSkillCombat = [
            // Acrobatics
            'balance', 'tumble-through', 'maneuver-in-flight',
            // Athletics
            'climb', 'high-jump', 'long-jump', 'swim',
            // Recall Knowledge
            'recall-knowledge',
            // Deception & Diplomacy
            'create-a-diversion', 'lie', 'request',
            // Intimidation & Performance
            'demoralize', 'perform',
            // Medicine 
            'administer-first-aid', 'treat-poison',
            // Nature
            'command-an-animal',
            // Stealth
            'hide', 'sneak',
            // Thievery
            'disable-a-device', 'pick-a-lock',
            // Computers (SF2)
            // Piloting (SF2)
            'drive', 'stop', 'stunt', 'take-control', 'run-over',
        ];
        // Skill Actions injetadas manualmente (não registradas no SF2):
        // treat-poison, retch, conceal-an-object, palm-an-object
        // → ver MANUAL_ACTIONS.encounter.skill_combat

        const slugsReactions = ['aid', 'arrest-a-fall', 'grab-an-edge', 'reactive-strike'];
        const slugsFreeActions = ['delay', 'release'];

        // ── Exploration ────────────────────────────────────────────────────────────
        const slugsExploration = [
            // SF2
            'analyze-environment', 'livestream', 'recharge', 'access-infosphere',
            'operate-device', 'hack', 'navigate', 'plot-course',
            // PF2
            'avoid-notice', 'scout', 'search', 'detect-magic',
            'defend', 'hustle',
            'sustain-an-effect', 'repeat-a-spell', 'squeeze',
            'squeeze',
            'borrow-an-arcane-spell', 'decipher-writing', 'identify-magic', 'learn-a-spell',
            'repair',
            'impersonate',
            'gather-information', 'make-an-impression', 'coerce',
            'sense-direction', 'cover-tracks', 'track',
        ];
        // Injetadas manualmente: treat-wounds, follow-the-expert, investigate
        // → ver MANUAL_ACTIONS.exploration

        // ── Downtime ───────────────────────────────────────────────────────────────
        const slugsDowntime = [
            'craft', 'earn-income', 'subsist', 'create-forgery'
        ];
        // Injetadas manualmente: treat-disease, subsist, craft, earn-income, create-forgery
        // Elas aparecem aqui apenas para evitar duplicidade se o sistema as registrar.
        // → ver MANUAL_ACTIONS.downtime

        // ── Buckets ────────────────────────────────────────────────────────────────
        const seenSlugs = new Set();

        const buckets = {
            encounter: {
                attack: [],
                movement: [],
                interact_percept: [],
                defense_support: [],
                specialty: [],
                skill_combat: [],
                reactions: [],
                free: []
            },
            exploration: [],
            downtime: []
        };

        // --- INJEÇÃO MANUAL PRIORITÁRIA ---
        for (const action of Config.MANUAL_ACTIONS.encounter.skill_combat) {
            seenSlugs.add(action.slug);
            buckets.encounter.skill_combat.push(await Utils.buildManualActionItem(this, action));
        }
        for (const action of Config.MANUAL_ACTIONS.exploration) {
            seenSlugs.add(action.slug);
            buckets.exploration.push(await Utils.buildManualActionItem(this, action));
        }
        for (const action of Config.MANUAL_ACTIONS.downtime) {
            seenSlugs.add(action.slug);
            buckets.downtime.push(await Utils.buildManualActionItem(this, action));
        }

        // ── 1. System Actions (game.pf2e.actions) ──────────────────────────────────
        if (game.pf2e?.actions) {
            for (const action of game.pf2e.actions) {
                if (seenSlugs.has(action.slug)) continue;
                seenSlugs.add(action.slug);

                const name = game.i18n.localize(action.name);
                const traits = action.traits instanceof Set ? Array.from(action.traits) : (action.traits || []);
                const glyph = this._getActionGlyph(action.cost || action.actionType);
                const display = Utils.prepareActionDisplay(name, action.slug, glyph, `skillaction:${action.slug}`);

                let img = (action.img && !display.hasRaIcon && !action.img.includes("mystery-man")) ? action.img : "";
                if (!img && !display.hasRaIcon) img = "icons/svg/d20.svg";

                // Variantes para ações com MAP ou sub-opções
                const variantMap = {
                    'trip': ['NORMAL', 'MAP -4', 'MAP -8'],
                    'grapple': ['NORMAL', 'MAP -4', 'MAP -8'],
                    'reposition': ['NORMAL', 'MAP -4', 'MAP -8'],
                    'shove': ['NORMAL', 'MAP -4', 'MAP -8'],
                    'force-open': ['NORMAL', 'MAP -5', 'MAP -10'],
                    'administer-first-aid': ['STABILIZE', 'STOP BLEEDING'],
                };
                const variants = variantMap[action.slug] || [];

                let finalName = display.html;
                if (variants.length > 0) {
                    let buttonsHtml = `<div style="display:flex; gap:3px; flex-wrap:wrap; margin-top:4px;">`;
                    variants.forEach((v, idx) => {
                        buttonsHtml += `
                            <button type="button"
                                onclick="event.stopPropagation(); StylishAction.useItem('skillaction:${action.slug}:${idx}', event)"
                                style="background: rgba(45, 79, 106, 0.8); border: 1px solid #00d2ff; color: #fff; border-radius: 2px; padding: 2px 4px; font-size: 0.75em; font-family: 'Oswald', sans-serif; cursor: pointer; line-height: 1; min-width: 32px; text-align: center; text-transform: uppercase; transition: all 0.2s ease;"
                                onmouseover="this.style.background='#00d2ff'; this.style.color='#000'; this.style.boxShadow='0 0 8px #00d2ff';"
                                onmouseout="this.style.background='rgba(45, 79, 106, 0.8)'; this.style.color='#fff'; this.style.boxShadow='none';"
                            >${v}</button>`;
                    });
                    buttonsHtml += `</div>`;
                    finalName = `<div style="display:flex; flex-direction:column; align-items:flex-start; width:100%;">${display.html}${buttonsHtml}</div>`;
                }

                const itemData = {
                    id: `skillaction:${action.slug}`,
                    name: finalName,
                    title: "",
                    img,
                    cost: "",
                    description: await Utils.prepareTooltip(name, game.i18n.localize(action.description), traits, null, false),
                    tooltipData: { traits, description: action.description }
                };

                if (slugsAttack.includes(action.slug)) buckets.encounter.attack.push(itemData);
                else if (slugsMovement.includes(action.slug)) buckets.encounter.movement.push(itemData);
                else if (slugsInteractPercept.includes(action.slug)) buckets.encounter.interact_percept.push(itemData);
                else if (slugsDefenseSupport.includes(action.slug)) buckets.encounter.defense_support.push(itemData);
                else if (slugsSpecialty.includes(action.slug)) buckets.encounter.specialty.push(itemData);
                else if (slugsSkillCombat.includes(action.slug)) buckets.encounter.skill_combat.push(itemData);
                else if (slugsReactions.includes(action.slug)) buckets.encounter.reactions.push(itemData);
                else if (slugsFreeActions.includes(action.slug)) buckets.encounter.free.push(itemData);
                else if (slugsExploration.includes(action.slug)) buckets.exploration.push(itemData);
                else if (slugsDowntime.includes(action.slug)) buckets.downtime.push(itemData);
                else {
                    // Fallback para não perder ações desconhecidas
                    if (action.actionType === "reaction" || action.actionType === "free") {
                        buckets.encounter.reactions.push(itemData);
                    } else {
                        buckets.encounter.skill_combat.push(itemData);
                    }
                }
            }
        }

        // ── 2. Actor Actions (Feats/Items) ─────────────────────────────────────────
        const actorItems = [...actor.itemTypes.action, ...actor.itemTypes.feat];
        for (const i of actorItems) {
            const actionType = i.system.actionType?.value || "action";
            const glyph = this._getActionGlyph(i.system.actions?.value || i.actionCost || actionType);
            const slug = i.slug || i.name.slugify();
            if (seenSlugs.has(slug)) continue;
            seenSlugs.add(slug);

            const display = Utils.prepareActionDisplay(i.name, slug, glyph, i.id);
            const traits = i.system.traits?.value || [];

            let img = (i.img && !display.hasRaIcon && !i.img.includes("mystery-man")) ? i.img : "";
            if (!img && !display.hasRaIcon) img = "icons/svg/d20.svg";

            const chatData = await i.getChatData();

            const itemData = {
                id: i.id,
                name: display.html,
                title: "",
                img,
                cost: "",
                description: await Utils.prepareTooltip(i.name, chatData.description.value, chatData.traits, chatData.rarity, false),
                tooltipData: { traits, rarity: i.system.traits?.rarity, description: i.system.description.value }
            };

            if (slugsAttack.includes(slug)) buckets.encounter.attack.push(itemData);
            else if (slugsMovement.includes(slug)) buckets.encounter.movement.push(itemData);
            else if (slugsInteractPercept.includes(slug)) buckets.encounter.interact_percept.push(itemData);
            else if (slugsDefenseSupport.includes(slug)) buckets.encounter.defense_support.push(itemData);
            else if (slugsSpecialty.includes(slug)) buckets.encounter.specialty.push(itemData);
            else if (actionType === "reaction" || slugsReactions.includes(slug)) buckets.encounter.reactions.push(itemData);
            else if (actionType === "free" || slugsFreeActions.includes(slug)) buckets.encounter.free.push(itemData);
            else if (actionType === "passive") { /* ignorar passivos */ }
            else if (i.type === "action") buckets.encounter.skill_combat.push(itemData);
        }

        // ── 4. Flatten buckets em listas com cabeçalhos ────────────────────────────
        const items = { encounter: [], exploration: [], downtime: [] };

        const encounterLabels = {
            attack: "Attacks & Maneuvers", movement: "Basic Movement",
            interact_percept: "Interact & Perceive", defense_support: "Defense & Support",
            specialty: "Specialized", skill_combat: "Skill Actions",
            reactions: "Reactions", free: "Free Actions"
        };

        for (const [key, label] of Object.entries(encounterLabels)) {
            if (buckets.encounter[key].length > 0) {
                items.encounter.push({ id: `header-encounter-${key}`, isHeader: true, name: label });
                items.encounter.push(...buckets.encounter[key].sort((a, b) => a.name.localeCompare(b.name)));
            }
        }

        if (buckets.exploration.length > 0) {
            items.exploration.push({ id: "header-exploration", isHeader: true, name: "Exploration" });
            items.exploration.push(...buckets.exploration.sort((a, b) => a.name.localeCompare(b.name)));
        }

        if (buckets.downtime.length > 0) {
            items.downtime.push({ id: "header-downtime", isHeader: true, name: "Downtime" });
            items.downtime.push(...buckets.downtime.sort((a, b) => a.name.localeCompare(b.name)));
        }

        const tabLabels = {
            encounter: "Encounter   <i class='ra ra-crossed-swords' style='margin-left: 5px;'></i>",
            exploration: "Exploration <i class='ra ra-compass'        style='margin-left: 5px;'></i>",
            downtime: "Downtime    <i class='ra ra-stopwatch'       style='margin-left: 5px;'></i>"
        };

        const tabTooltips = { encounter: "", exploration: "", downtime: "" };

        return { title: "ACTIONS", theme: "blue", hasTabs: true, hasSubTabs: false, items, tabLabels, tabTooltips };
    }

    /**
     * Move os Strikes para dentro do menu de Ações, como primeira seção de Encounter.
     */
    async _getSystemSubMenuData(actor, systemId, menuData) {
        if (systemId === "action") {
            const actionData = await this._getActionData(actor);
            const strikeData = await super._getSystemSubMenuData(actor, "strike", menuData);

            if (!actionData) return strikeData || { title: menuData.label, items: [] };

            if (Array.isArray(actionData.items?.encounter)) {
                let attackIdx = actionData.items.encounter.findIndex(i => i.isHeader && i.name.includes("Attacks"));
                if (attackIdx === -1) attackIdx = 0;

                actionData.items.encounter.splice(attackIdx + 1, 0,
                    ...strikeData.items,
                    { id: "separator-strikes", isHeader: false, name: "---", img: "" }
                );
            }

            actionData.title = menuData.label;
            return actionData;
        }
        return super._getSystemSubMenuData(actor, systemId, menuData);
    }

    /**
     * Layout padrão do HUD para Starfinder 2e.
     */
    getDefaultLayout() {
        return [
            { systemId: "spell", label: "Spells    <i class='ra ra-bleeding-eye'  style='margin-left: 10px;'></i>", icon: "", img: "", type: "submenu", useSidebar: true, tooltip: "" },
            { systemId: "action", label: "Actions   <i class='ra ra-aware'         style='margin-left: 10px;'></i>", icon: "", img: "", type: "submenu", useSidebar: true, tooltip: "" },
            { systemId: "feat", label: "Feats     <i class='ra ra-regeneration'  style='margin-left: 10px;'></i>", icon: "", img: "", type: "submenu", useSidebar: true, tooltip: "" },
            { systemId: "utility", label: "Utility   <i class='ra ra-gear-hammer'   style='margin-left: 10px;'></i>", icon: "", img: "", type: "submenu", useSidebar: true, tooltip: "" },
            { systemId: "inventory", label: "Inventory <i class='ra ra-triforce'      style='margin-left: 10px;'></i>", icon: "", img: "", type: "submenu", useSidebar: true, tooltip: "" },
        ];
    }

    /**
     * Regra SF2e: Stamina absorve dano antes do HP.
     */
    async updateAttribute(actor, path, input) {
        const prop = foundry.utils.getProperty(actor, path);
        const val = (typeof prop === "object") ? prop.value : prop;
        const max = (typeof prop === "object") ? prop.max : 0;

        const numericInput = Number(input);
        let newValue = (input.startsWith("+") || input.startsWith("-")) ? val + numericInput : numericInput;

        if (path.endsWith(".hp") && newValue < val) {
            const damage = val - newValue;
            const stamina = actor.system.attributes.sp;
            if (stamina?.value > 0) {
                const spDamage = Math.min(damage, stamina.value);
                await actor.update({ "system.attributes.sp.value": stamina.value - spDamage });
                newValue = val - (damage - spDamage);
            }
        }

        const updatePath = (typeof prop === "object") ? `${path}.value` : path;
        await actor.update({ [updatePath]: max > 0 ? Math.clamp(newValue, 0, max) : Math.max(0, newValue) });
    }

    /**
     * Manipula a execução das ações utilitárias e itens do ator.
     */
    async useItem(actor, itemId, event = null) {
        const e = event || window.event || {};
        const cleanEvent = this._normalizePointerEvent(e);

        // Normaliza a detecção de comando de chat enviado pelos ícones do HUD
        const isChat = itemId.endsWith(":chat") || itemId.endsWith("_chat");
        const effectiveId = isChat ? itemId.slice(0, -5) : itemId;

        // Skill Actions do sistema (ex: Trip, Sense Motive, Treat Wounds injetadas manualmente)
        if (effectiveId.startsWith("skillaction:")) {
            const parts = effectiveId.split(":");
            const slug = parts[1];
            const variantIdx = parts[2];
            let action = game.pf2e.actions.get(slug);

            if (!action) {
                const allManual = [
                    ...Config.MANUAL_ACTIONS.encounter.skill_combat,
                    ...Config.MANUAL_ACTIONS.exploration,
                    ...Config.MANUAL_ACTIONS.downtime
                ];
                const manualData = allManual.find(m => m.slug === slug);
                if (manualData) {
                    const name = game.i18n.has(manualData.nameKey) ? game.i18n.localize(manualData.nameKey) : manualData.nameFallback;
                    const content = await Utils.prepareTooltip(name, manualData.descKey, manualData.traits, null, true);
                    return await ChatMessage.create({
                        user: game.user.id,
                        speaker: ChatMessage.getSpeaker({ actor }),
                        content: content
                    });
                }
                return;
            }

            if (isChat) {
                const name = game.i18n.localize(action.name || action.label);
                // Garante que a descrição seja extraída corretamente se for um objeto do sistema
                const rawDesc = action.description?.value || action.description;
                const traits = action.traits instanceof Set ? Array.from(action.traits) : (action.traits || []);

                const content = await Utils.prepareTooltip(name, rawDesc, traits, null, true);
                return await ChatMessage.create({
                    user: game.user.id,
                    speaker: ChatMessage.getSpeaker({ actor }),
                    content: content
                });
            }

            const options = { event: cleanEvent, actors: [actor] };
            if (variantIdx !== undefined) {
                if (['trip', 'grapple', 'shove', 'reposition', 'disarm', 'force-open'].includes(slug)) {
                    options.mapIncreases = parseInt(variantIdx);
                } else {
                    options.variant = variantIdx;
                }
            }
            return action.use(options);
        }

        // Utilidades SF2e
        if (itemId.startsWith("sf2e-util:")) {
            const action = itemId.replace("sf2e-util:", "");
            if (action === "use-resolve") return actor.sheet.render(true);
        }

        // Itens do inventário e Actor Actions
        const parts = effectiveId.split("_");
        const realItemId = parts[0];
        const command = isChat ? "chat" : (parts.length > 1 ? parts[1] : null);

        if (!command && !effectiveId.includes(":") && !effectiveId.startsWith("macro-") && !effectiveId.startsWith("blast_")) {
            let item = actor.items.get(realItemId);
            if (!item) item = this.findSyntheticItem(actor, realItemId);

            if (item) {
                const infoTypes = ["weapon", "armor", "equipment", "consumable", "treasure", "backpack", "ammo", "augmentation", "upgrade"];
                if (infoTypes.includes(item.type)) return item.sheet.render(true);

                if (["feat", "action"].includes(item.type)) {
                    if (cleanEvent.shiftKey) return item.sheet.render(true);
                    return item.toChat ? item.toChat(e) : item.use({ event: e });
                }
            }
        }

        if (command === "chat") {
            const item = actor.items.get(realItemId) || this.findSyntheticItem(actor, realItemId);
            if (item) {
                if (typeof item.toChat === "function") return item.toChat(e);
                return item.use({ event: { shiftKey: true } });
            }
        }

        return super.useItem(actor, effectiveId, event);
    }
}

// ── Registro do Adaptador ──────────────────────────────────────────────────────
Hooks.once("stylish-action-hud.apiReady", api => {
    api.registerSystemAdapter("sf2e", Starfinder2eAdapter);

    // CSS: alterna ícone base ↔ ícone de chat no hover
    const style = document.createElement("style");
    style.innerHTML = `
        .sf2e-action-item-row:hover .sf2e-base-icon  { opacity: 0; }
        .sf2e-action-item-row:hover .sf2e-chat-icon  { opacity: 1 !important; }
        .sah-tab.active { background-color: #560d11 !important; color: white !important; }
        .starfinder-style .tag.untrained { background-color: #424242 !important; color: white !important; }
        .starfinder-style .tag.trained { background-color: #2c4e69 !important; color: white !important; }
        .starfinder-style .tag.expert { background-color: #5a3994 !important; color: white !important; }
        .starfinder-style .tag.master { background-color: #2c4e69 !important; color: white !important; }
        .starfinder-style .tag.legendary { background-color: #2c4e69 !important; color: white !important; }
    `;
    document.head.appendChild(style);

    console.log("SF2E Stylish Action HUD | Adaptador Starfinder 2e inicializado com sucesso.");
});