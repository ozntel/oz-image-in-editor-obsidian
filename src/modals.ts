import { App, Modal } from 'obsidian';

export class ConfirmationModal extends Modal {
    callback: Function;
    message: string;

    constructor(app: App, message: string, callback: Function) {
        super(app);
        this.message = message;
        this.callback = callback;
    }

    onOpen() {
        let { contentEl } = this;

        let mainDiv = contentEl.createEl('div');
        mainDiv.addClass('oz-modal-center');
        mainDiv.innerHTML = `
            <div class="oz-modal-title">
                <h2>Ozan's Image in Editor</h2>
            </div>
            <p>${this.message}</p>
        `;

        let continueButton = contentEl.createEl('button', { text: 'Continue' });
        continueButton.addEventListener('click', () => {
            this.callback();
            this.close();
        });

        const cancelButton = contentEl.createEl('button', { text: 'Cancel' });
        cancelButton.style.cssText = 'float: right;';
        cancelButton.addEventListener('click', () => this.close());
    }
}
