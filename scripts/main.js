/* scripts/main.js */
import { Pf2eAdapter } from "./pf2e.js";

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
            { path: "system.attributes.hp", label: "HP", color: "#e61c34", style: "bar", icon: "fas fa-heart" },
            { path: "system.attributes.sp", label: "SP", color: "#18d4f3", style: "bar", icon: "fas fa-bolt" },
            { path: "system.attributes.ac.value", label: "AC", color: "#ffffff", style: "badge", icon: "fas fa-shield-halved" },
            { path: "system.resources.rp", label: "RP", color: "#f1c40f", style: "badge", icon: "fas fa-atom", badgeScale: 1.0 },
        ];
    }

    // Adiciona atributos rastreáveis específicos do SF2e
    getTrackableAttributes(actor) {
        const stats = super.getTrackableAttributes(actor);
        const s = actor.system;

        if (s.attributes?.sp) {
            stats.push({ path: "system.attributes.sp", label: "Stamina Points (SP)" });
        }
        if (s.resources?.rp) stats.push({ path: "system.resources.rp", label: "Resolve Points (RP)", style: "dots" });

        return stats;
    }

    /**
     * Injeta as utilidades mantendo os Saves, Toggles e Macros nativos.
     * O Stylish HUD separa isso em abas: Saves, Skills, Toggles, Other.
     */
    _getUtilityData(actor) {
        // Obtém os dados base (Saves, Skills, Toggles, Other, Macro)
        const data = super._getUtilityData(actor);

        // 1. Processamento de Perícias (Skills & Lore)
        if (data.items?.skill) {
            // Limpa os nomes das perícias padrão (remove o código de tradução bruto)
            if (data.items.skill.all) {
                data.items.skill.all.forEach(item => {
                    if (item.name) item.name = item.name.replace(/\s*\(P?S?F2E\.Skill\.[^)]+\)/gi, "");
                });
            }

            // Cria a sub-aba separada para Lore
            data.items.skill.lore = [];
            actor.itemTypes.lore.forEach(lore => {
                const mod = lore.system.mod?.value ?? lore.system.value ?? 0;
                data.items.skill.lore.push({
                    id: `skill-${lore.slug || lore.id}`,
                    name: lore.name,
                    img: lore.img || "icons/svg/book.svg",
                    cost: `${mod >= 0 ? "+" : ""}${mod}`,
                    description: game.i18n.format("PF2E.SkillCheckWithName", { skillName: lore.name })
                });
            });

            // Define os rótulos das sub-abas para separação visual
            if (!data.subTabLabels.skill) {
                data.subTabLabels.skill = {};
            }
            data.subTabLabels.skill = {
                all: game.i18n.localize("PF2E.SkillsLabel") || "Skills",
                lore: "Lore Skills"
            };

            data.items.skill.lore.sort((a, b) => a.name.localeCompare(b.name));
        }

        // 2. Outras utilidades (Resolve e GM Tools)
        if (data.items?.other?.all) {
            data.items.other.all.push({
                id: "sf2e-util:use-resolve",
                name: "Use Resolve",
                img: "icons/magic/symbols/star-yellow.webp",
                cost: "RP",
                description: "Spend Resolve Points for stamina recovery or stabilization."
            });
        }

        return data;
    }

    /**
     * Corrige nomes de ações que mostram chaves de tradução brutas (como PF2E.Skill...)
     */
    _getActionData(actor) {
        const data = super._getActionData(actor);

        const cleanupNames = (items) => {
            items.forEach(item => {
                if (item.name && typeof item.name === 'string') {
                    // Remove o sufixo de tradução quebrada (ex: "Recall Knowledge (PF2E.Skill.Arcana)")
                    item.name = item.name.replace(/\s*\(P?S?F2E\.Skill\.[^)]+\)/gi, "");
                }
            });
        };

        if (data.items) {
            if (data.items.basic?.all) cleanupNames(data.items.basic.all);
            if (data.items.skill?.all) cleanupNames(data.items.skill.all);
        }

        return data;
    }

    /**
     * Replica o comportamento do pf2e-hud: move os Strikes para dentro do menu de Ações.
     * Eles aparecem como a primeira aba/seção do submenu.
     */
    async _getSystemSubMenuData(actor, systemId, menuData) {
        if (systemId === "action") {
            // Obtém os dados originais de ações e ataques
            // Adiciona fallback para garantir que os objetos existam
            const actionData = await super._getSystemSubMenuData(actor, "action", menuData) || { items: {}, tabLabels: {}, subTabLabels: {} };
            const strikeData = await super._getSystemSubMenuData(actor, "strike", menuData) || { items: [] }; // strikeData.items é um array

            // Insere os Strikes como a primeira aba do menu de Ações
            const strikeTabKey = "strike";
            const strikeLabel = "Strikes"; // Nome curto e direto

            // Garante que as propriedades de actionData sejam objetos antes de usar o spread
            if (!actionData.items || typeof actionData.items !== 'object') {
                actionData.items = {};
            }
            if (!actionData.tabLabels || typeof actionData.tabLabels !== 'object') {
                actionData.tabLabels = {};
            }
            if (!actionData.subTabLabels || typeof actionData.subTabLabels !== 'object') {
                actionData.subTabLabels = {};
            }

            // Injeta Strikes como a primeira aba do menu de ações
            actionData.items = {
                [strikeTabKey]: { all: strikeData.items },
                ...actionData.items
            };
            actionData.tabLabels = {
                [strikeTabKey]: strikeLabel,
                ...actionData.tabLabels
            };

            actionData.subTabLabels = {
                [strikeTabKey]: { all: strikeLabel },
                ...actionData.subTabLabels
            };

            return actionData;
        }
        return super._getSystemSubMenuData(actor, systemId, menuData);
    }

    /**
     * Define as categorias padrão do menu de ações para Starfinder 2e.
     * O Strike foi removido do topo (getDefaultLayout) para ficar dentro de 'Action'.
     */
    getDefaultLayout() {
        return [
            {
                systemId: "spell",
                label: "Spells", // Nome curto e direto
                icon: "fas fa-wand-magic-sparkles",
                type: "submenu",
                useSidebar: true,
            },
            {
                systemId: "action",
                label: "Actions", // Nome curto e direto
                icon: "fas fa-crosshairs", // Ícone de mira, comum em HUDs de combate
                type: "submenu",
                useSidebar: true,
            },
            {
                systemId: "feat",
                label: "Feats", // Nome curto e direto
                icon: "fas fa-microchip", // Representando Augmentations/Feats tecnológicos
                type: "submenu",
                useSidebar: true,
            },
            {
                systemId: "utility",
                label: "Utility", // Nome curto e direto
                icon: "fas fa-gears",
                type: "submenu",
                useSidebar: true,
            },
            {
                systemId: "inventory",
                label: "Inventory", // Nome curto e direto
                icon: "fas fa-suitcase-rolling",
                type: "submenu",
                useSidebar: true,
            },
        ];
    }

    // Regra SF2e: Stamina absorve dano antes do HP
    async updateAttribute(actor, path, input) {
        const current = foundry.utils.getProperty(actor, path);
        const val = (current && typeof current === "object") ? current.value : current;
        const max = (current && typeof current === "object") ? current.max : 0;

        const numericInput = Number(input);
        let newValue = (input.startsWith("+") || input.startsWith("-")) ? val + numericInput : numericInput;

        if (path.includes("hp") && newValue < val) {
            const damage = val - newValue;
            const sp = actor.system.attributes.sp?.value || 0;
            if (sp > 0) {
                const spDamage = Math.min(damage, sp);
                await actor.update({ "system.attributes.sp.value": Math.max(0, sp - spDamage) });
                newValue = val - (damage - spDamage);
            }
        }
        const updatePath = (current && typeof current === "object") ? `${path}.value` : path;
        await actor.update({ [updatePath]: max > 0 ? Math.clamp(newValue, 0, max) : Math.max(0, newValue) });
    }

    /**
     * Manipula a execução das novas ações utilitárias.
     */
    async useItem(actor, itemId, event = null) {
        if (itemId.startsWith("sf2e-util:")) {
            const action = itemId.replace("sf2e-util:", "");

            // Normaliza o evento para garantir que as propriedades (ctrl, shift) sejam passadas corretamente ao motor PF2e
            const e = event || window.event || {};
            const cleanEvent = this._normalizePointerEvent(e);

            switch (action) {
                case "use-resolve":
                    // Abre a ficha ou dispara o diálogo de repouso se disponível
                    return actor.sheet.render(true);
            }
        }
        return super.useItem(actor, itemId, event);
    }
}

Hooks.once("stylish-action-hud.apiReady", api => {
    // Registra o adaptador para o sistema sf2e
    api.registerSystemAdapter("sf2e", Starfinder2eAdapter);

    console.log("SF2E Stylish Action HUD | Adaptador Starfinder 2e inicializado com sucesso.");
});