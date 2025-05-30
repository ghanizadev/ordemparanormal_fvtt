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
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ['ordemparanormal', 'sheet', 'item'],
			width: 540,
			height: 440,
			template: 'systems/ordemparanormal/templates/item/item-sheet.html',
			tabs: [
				{
					navSelector: '.sheet-tabs',
					contentSelector: '.sheet-body',
					initial: 'description',
				},
			],
		});
	}

	/** @override */
	get template() {
		const path = 'systems/ordemparanormal/templates/item';
		// Return a single sheet for all item types.
		// return `${path}/item-sheet.html`;

		// Alternatively, you could use the following return statement to do a
		// unique item sheet by type, like `weapon-sheet.html`.
		return `${path}/item-${this.item.type}-sheet.html`;
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
			optionWeaponType: CONFIG.op.dropdownWeaponType,
			optionWeaponSubType: CONFIG.op.dropdownWeaponSubType,
			optionGripType: CONFIG.op.dropdownWeaponGripType,
			optionWeaponAmmunition: CONFIG.op.dropdownWeaponAmmunition,
			optionProficiency: CONFIG.op.dropdownProficiency,
			optionDamageType: CONFIG.op.dropdownDamageType,
			optionPowerType: CONFIG.op.dropdownPowerType,
			optionRange: CONFIG.op.dropdownRange,
			optionTarget: CONFIG.op.dropdownTarget,
			optionArea: CONFIG.op.dropdownArea,
			optionAreaType: CONFIG.op.dropdownAreaType,
			optionDuration: CONFIG.op.dropdownDuration,
			optionResistance: CONFIG.op.dropdownResistance,
			optionSkillResis: CONFIG.op.dropdownSkillResis,
			optionElement: CONFIG.op.dropdownElement,
			// Attack and Damage Dropdown
			attributes: CONFIG.op.attributes,
			attackSkills: CONFIG.op.attackSkills,
			// Ritual's Dropdowns
			optionExecution: CONFIG.op.dropdownExecution,
			// Item's Radiobox
			categories: CONFIG.op.categories,
			degree: CONFIG.op.ritualDegree,
		});

		const enrichmentOptions = {
			secrets: this.item.isOwner,
			relativeTo: this.item,
			rollData: context.rollData
		};
		
		context.enriched = {
			description: await TextEditor.enrichHTML(context.system.description ?? '', enrichmentOptions)
		};

		// https://foundryvtt.com/api/classes/foundry.abstract.Document.html#updateDocuments
		// https://foundryvtt.com/api/classes/foundry.abstract.Document.html#deleteDocuments

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
		if (a.classList.contains('add-damage')) {
			await this._onSubmit(event); // Submit any unsaved changes
			const damage = this.item.system.formulas.damage;
			return this.item.update({
				'system.formulas.damage.parts': damage.parts.concat([['', '']]),
			});
		}

		// Remove a damage component
		if (a.classList.contains('delete-damage')) {
			await this._onSubmit(event); // Submit any unsaved changes
			const li = a.closest('.damage-part');
			const damage = foundry.utils.deepClone(this.item.system.formulas.damage);
			damage.parts.splice(Number(li.dataset.damagePart), 1);
			return this.item.update({ 'system.formulas.damage.parts': damage.parts });
		}
	}

	/* -------------------------------------------- */
	/*  Form Submission                             */
	/* -------------------------------------------- */

	/** @inheritDoc */
	_getSubmitData(updateData = {}) {
		const formData = foundry.utils.expandObject(
			super._getSubmitData(updateData),
		);

		// Handle Damage array
		const damage = formData.system?.formulas?.damage;
		if (damage)
			damage.parts = Object.values(damage?.parts || {}).map((d) => [
				d[0] || '',
				d[1] || '',
			]);

		// Return the flattened submission data
		return foundry.utils.flattenObject(formData);
	}

	/** @override */
	activateListeners(html) {
		super.activateListeners(html);

		// Everything below here is only needed if the sheet is editable
		if (!this.isEditable) return;

		html.find('.damage-control').click(this._onDamageControl.bind(this));

		html
			.find('.effect-control')
			.click((ev) => onManageActiveEffect(ev, this.item));

		// Roll handlers, click handlers, etc. would go here.
	}

	/* -------------------------------------------- */

	/** @inheritdoc */
	async _onSubmit(...args) {
		await super._onSubmit(...args);
	}

	/* -------------------------------------------- */
}
