import {
	onManageActiveEffect,
	prepareActiveEffectCategories,
} from '../helpers/effects.mjs';

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class OrdemItemSheet extends ItemSheet {

	/** @override */
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			classes: ['ordemparanormal', 'sheet', 'item'],
			width: 540,
			height: 440,
			template: 'systems/ordemparanormal/templates/itemn/item-sheet.html',
			tabs: [{ navSelector: '.sheet-tabs', contentSelector: '.sheet-body', initial: 'description' }]
		});
	}

	/** @override */
	get template() {
		const path = 'systems/ordemparanormal/templates/item';
		// Return a single sheet for all item types.
		// return `${path}/item-sheet.html`;

		// Alternatively, you could use the following return statement to do a
		// unique item sheet by type, like `weapon-sheet.html`.
		return `${path}/item-${this.item.data.type}-sheet.html`;
	}

	/* -------------------------------------------- */

	/** @override */
	async getData() {
		// Retrieve base data structure.
		const context = await super.getData();
		const itemData = context.item;
		const source = itemData.toObject();

		foundry.utils.mergeObject(context, {
			source: source.system,
			system: itemData.system,
			rollData: this.item.getRollData(),
			flags: itemData.flags,
			effects: prepareActiveEffectCategories(this.item.effects),

			// Armament's Dropdowns
			optionWeaponType: CONFIG.ordemparanormal.dropdownWeaponType,
			optionWeaponSubType: CONFIG.ordemparanormal.dropdownWeaponSubType,
			optionGripType: CONFIG.ordemparanormal.dropdownWeaponGripType,
			optionWeaponAmmunition: CONFIG.ordemparanormal.dropdownWeaponAmmunition,
			optionProficiency: CONFIG.ordemparanormal.dropdownProficiency,
			optionDamageType: CONFIG.ordemparanormal.dropdownDamageType,
			optionPowerType: CONFIG.ordemparanormal.dropdownPowerType,
			optionRange: CONFIG.ordemparanormal.dropdownRange,
			optionTarget: CONFIG.ordemparanormal.dropdownTarget,
			optionArea: CONFIG.ordemparanormal.dropdownArea,
			optionDuration: CONFIG.ordemparanormal.dropdownDuration,
			optionResistance: CONFIG.ordemparanormal.dropdownResistance,
			optionElement: CONFIG.ordemparanormal.dropdownElement,

			// Attack and Damage Dropdown
			attributes: CONFIG.ordemparanormal.attributes,
			attackSkills: CONFIG.ordemparanormal.attackSkills,

			// Ritual's Dropdowns
			optionExecution: CONFIG.ordemparanormal.dropdownExecution,

			// Item's Radiobox
			categories: CONFIG.ordemparanormal.categories,
			degree: CONFIG.ordemparanormal.ritualDegree,
		});

		// https://foundryvtt.com/api/classes/foundry.abstract.Document.html#updateDocuments
		// https://foundryvtt.com/api/classes/foundry.abstract.Document.html#deleteDocuments

		// TODO: Fix the incompatibilities (Temporary)
		// if (itemData.system.types?.damageType) {
		// 	itemData.system.formulas.damage.type = itemData.system.types.damageType;
		// 	delete itemData.system.types.damageType;
		// }
		// // TODO: Fix the incompatibilities (Temporary)
		// if (itemData.system.formulas?.attackFormula) {
		// 	itemData.system.formulas.damage.formula = itemData.system.formulas.attackFormula.formula;
		// 	itemData.system.formulas.damage.attr = itemData.system.formulas.attackFormula.attr;
		// 	itemData.system.formulas.damage.bonus = itemData.system.formulas.attackFormula.bonus;
		// 	delete itemData.system.formulas.attackFormula;
		// }
		// // TODO: Fix the incompatibilities (Temporary)
		// if (itemData.system.formulas?.damageFormula) {
		// 	itemData.system.formulas.damage.formula = itemData.system.formulas.damageFormula.formula;
		// 	itemData.system.formulas.damage.attr = itemData.system.formulas.damageFormula.attr;
		// 	itemData.system.formulas.damage.bonus = itemData.system.formulas.damageFormula.bonus;
		// 	delete itemData.system.formulas.damageFormula;
		// }

		// console.log(itemData);
		// console.log(source);
		// console.log(Actor);
		// console.log(Item);
		// game.actors.map(a => a.items.filter(b => (b.type == 'armament') && console.log(b.name, b.system.formulas)));
		// await Item.updateDocuments(game.actors.map(a => a.toObject()), {diff: false, recursive: false});
		// await Item.updateDocuments(game.actors.map(a => a.toObject()), {diff: false, recursive: false});
		// console.log(game.actors);

		return context;
	}

	/* -------------------------------------------- */

	/**
   * Add or remove a damage part from the damage formula.
   * @param {Event} event             The original click event.
   * @returns {Promise<OrdemItemSheet>|null}  Item with updates applied.
   * @private
   */
	async _onDamageControl(event) {
		event.preventDefault();
		const a = event.currentTarget;
	
		 // Add new damage component
		 if ( a.classList.contains('add-damage') ) {
			await this._onSubmit(event);  // Submit any unsaved changes
			const damage = this.item.system.formulas.damage;
			return this.item.update({'system.formulas.damage.parts': damage.parts.concat([['', '']])});
		  }
	  
		  // Remove a damage component
		  if ( a.classList.contains('delete-damage') ) {
			await this._onSubmit(event);  // Submit any unsaved changes
			const li = a.closest('.damage-part');
			const damage = foundry.utils.deepClone(this.item.system.formulas.damage);
			damage.parts.splice(Number(li.dataset.damagePart), 1);
			return this.item.update({'system.formulas.damage.parts': damage.parts});
		  }
	}

	/* -------------------------------------------- */
	/*  Form Submission                             */
	/* -------------------------------------------- */

	/** @inheritDoc */
	_getSubmitData(updateData={}) {
		const formData = foundry.utils.expandObject(super._getSubmitData(updateData));

		// Handle Damage array
    	const damage = formData.system?.formulas?.damage;
    	if ( damage ) damage.parts = Object.values(damage?.parts || {}).map(d => [d[0] || '', d[1] || '']);

		// Return the flattened submission data
		return foundry.utils.flattenObject(formData);
	}


	/** @override */
	activateListeners(html) {
		super.activateListeners(html);

		// Everything below here is only needed if the sheet is editable
		if (!this.isEditable) return;

		html.find('.damage-control').click(this._onDamageControl.bind(this));

		html.find('.effect-control').click((ev) =>
			onManageActiveEffect(ev, this.item),
		);

		// Roll handlers, click handlers, etc. would go here.
	}

	/* -------------------------------------------- */

	/** @inheritdoc */
	async _onSubmit(...args) {
		await super._onSubmit(...args);
	}

	/* -------------------------------------------- */
}
