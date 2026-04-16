import { RPG_AWESOME_ICONS } from "./sf2e-config.js";

/**
 * Prepara o HTML do Tooltip rico
 */
export async function prepareTooltip(name, description, traits = [], rarity = null, showHeader = false) {
    if (!description && (!traits || traits.length === 0)) return "";

    const descStr = String(description || "");
    const isKey = descStr.toLowerCase().startsWith('pf2e.') || descStr.toLowerCase().startsWith('sf2e.');
    const finalDescription = isKey ? game.i18n.localize(descStr) : descStr;

    // Padrão Starfinder 2e: Título limpo com borda inferior azul e tipografia Teko
    let header = `
    <header class="card-header" style="background: #2a404e; padding: 4px 8px; border-bottom: 1px solid #00d2ff; margin-bottom: 8px;">
        <h3 style="margin: 0; font-weight: 600; font-family: 'Teko', sans-serif; font-size: 1.6em; color: white; text-transform: uppercase; letter-spacing: 1px; border: none; line-height: 1;">
            ${name}
        </h3>
    </header>`;

    let tagsHtml = '<div class="tags" style="margin-bottom: 8px;">';

    if (rarity) {
        const rName = (rarity.name || rarity.value || (typeof rarity === 'string' ? rarity : "")).toLowerCase();
        const rLabel = rarity.label || game.i18n.localize(CONFIG.PF2E?.rarityTraits?.[rName] || rName);
        tagsHtml += `<span class="tag rarity ${rName}">${rLabel}</span>`;
    }

    const traitList = Array.isArray(traits) ? traits : (traits instanceof Set ? Array.from(traits) : (traits?.value || []));
    traitList.forEach(t => {
        const traitKey = t.value || t.name || t;
        const label = t.label || game.i18n.localize(CONFIG.PF2E.actionTraits[traitKey] || traitKey);
        if (label) tagsHtml += `<span class="tag">${label}</span>`;
    });
    tagsHtml += '</div>';

    const headerHtml = showHeader ? header : "";
    const tooltipHtml = `<div class="pf2e chat-card starfinder-style"><div class="card-content" style="padding: 5px;">${headerHtml}${tagsHtml}<div class="description" style="font-size: 1em; line-height: 1.4; color: inherit;">${finalDescription}</div></div></div>`;
    return await TextEditor.enrichHTML(tooltipHtml, { async: true });
}

/**
 * Trata o nome da ação e define o ícone
 */
export function prepareActionDisplay(name, slug, glyph = "", fullId = "") {
    let cleanName = name ? String(name).replace(/\s*\(P?S?F2E\.Skill\.[^)]+\)/gi, "") : "";

    if (cleanName.includes('.') && (cleanName.toLowerCase().includes('pf2e') || cleanName.toLowerCase().includes('sf2e'))) {
        const parts = cleanName.split('.');
        let segment = parts[parts.length - 1];
        if ((segment.toLowerCase() === "title" || segment.toLowerCase() === "label") && parts.length > 1) {
            segment = parts[parts.length - 2];
        }
        cleanName = segment.replace(/-/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').trim();
        cleanName = cleanName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    }

    let raClass = RPG_AWESOME_ICONS[slug] || "fa-solid fa-dice-d20";

    const iconHtml = `
        <div class="sf2e-hud-icon-wrapper" style="position:relative; margin-right: 12px; width:22px; height:22px; display:inline-flex; align-items:center; justify-content:center; color: #00d2ff;">
            <i class="${raClass} sf2e-base-icon" style="font-size:1.2em; transition: opacity 0.1s;"></i>
            <i class="fa-solid fa-comment-alt sf2e-chat-icon" onclick="event.stopPropagation(); StylishAction.useItem('${fullId}:chat', event)" style="position:absolute; opacity:0; transition: opacity 0.15s; color: #00d2ff; font-size: 1.1em; cursor:pointer; pointer-events:auto;"></i>
        </div>`;

    return {
        hasRaIcon: !!RPG_AWESOME_ICONS[slug],
        html: `<div class="sf2e-action-item-row" title="" style="display:flex; align-items:center; justify-content:space-between; width:100%; gap:10px; padding: 2px 0;">
                <span style="font-size:1.1em; font-weight:500; font-family:'Oswald', sans-serif; line-height:1.2; text-align:left; display: flex; align-items: center; color: #f0f0f0; text-transform: uppercase;">${iconHtml}${cleanName}</span>
                <span style="margin-left:auto; display:flex; align-items:center; color: #00d2ff;">${glyph}</span>
               </div>`
    };
}

/**
 * Converte entrada de MANUAL_ACTIONS para formato do HUD
 */
export async function buildManualActionItem(adapter, entry) {
    const name = game.i18n.has(entry.nameKey) ? game.i18n.localize(entry.nameKey) : entry.nameFallback;
    const glyph = adapter._getActionGlyph(entry.cost);
    const display = prepareActionDisplay(name, entry.slug, glyph, `skillaction:${entry.slug}`);
    return { id: `skillaction:${entry.slug}`, name: display.html, title: "", img: "", cost: "", description: await prepareTooltip(name, entry.descKey, entry.traits, null, false) };
}