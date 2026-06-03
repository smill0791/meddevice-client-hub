import { LightningElement, api, wire } from "lwc";
import { NavigationMixin } from "lightning/navigation";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import getAccountAssets from "@salesforce/apex/AssetController.getAccountAssets";
import createCase from "@salesforce/apex/CaseController.createCase";
import saveFile from "@salesforce/apex/CaseController.saveFile";

const STEPS = ["select", "describe", "attach", "review"];

const PRIORITY_OPTIONS = [
  { label: "Low", value: "Low" },
  { label: "Medium", value: "Medium" },
  { label: "High", value: "High" }
];

/**
 * Multi-step support-case creation wizard — the portal's flagship workflow.
 * Steps: Select Device -> Describe Issue -> Attach Files -> Review & Submit.
 *
 * Validates per step, stages files client-side (read to base64), and on submit
 * creates the case then attaches any staged files to it. Fires `casecreated`
 * (detail: { caseId }) so a sibling case list can refresh.
 *
 * Consumes: AssetController.getAccountAssets, CaseController.createCase,
 *           CaseController.saveFile
 */
export default class CaseWizard extends NavigationMixin(LightningElement) {
  // 1. Public reactive properties
  @api accountId;
  /** Optional device to pre-select (e.g., when launched from a device page). */
  @api preselectedAssetId;

  // 2. Private reactive properties
  currentStep = "select";
  priorityOptions = PRIORITY_OPTIONS;

  assets = [];
  assetsLoading = true;
  assetError;

  // Form state
  selectedAssetId;
  subject = "";
  description = "";
  priority = "Medium";
  errorCode = "";
  stagedFiles = [];

  isSubmitting = false;
  submitError;
  createdCaseId;

  // 3. Wire adapters
  @wire(getAccountAssets, { accountId: "$accountId" })
  wiredAssets({ data, error }) {
    this.assetsLoading = false;
    if (data) {
      this.assets = data;
      this.assetError = undefined;
      if (this.preselectedAssetId && !this.selectedAssetId) {
        this.selectedAssetId = this.preselectedAssetId;
      }
    } else if (error) {
      this.assetError = error;
      this.assets = [];
    }
  }

  // 6. Event handlers — field changes
  handleAssetChange(event) {
    this.selectedAssetId = event.detail.value;
  }
  handleSubjectChange(event) {
    this.subject = event.target.value;
  }
  handleDescriptionChange(event) {
    this.description = event.target.value;
  }
  handlePriorityChange(event) {
    this.priority = event.detail.value;
  }
  handleErrorCodeChange(event) {
    this.errorCode = event.target.value;
  }

  // 6. Event handlers — files
  handleFileChange(event) {
    const files = Array.from(event.target.files || []);
    Promise.all(files.map((f) => this._readFile(f)))
      .then((read) => {
        this.stagedFiles = [...this.stagedFiles, ...read];
      })
      .catch(() => {
        this._toast("Could not read one or more files", "error");
      });
  }
  handleRemoveFile(event) {
    const name = event.currentTarget.dataset.name;
    this.stagedFiles = this.stagedFiles.filter((f) => f.name !== name);
  }

  // 6. Event handlers — navigation
  handleNext() {
    if (!this._validateCurrentStep()) {
      return;
    }
    const idx = this.currentStepIndex;
    if (idx < STEPS.length - 1) {
      this.currentStep = STEPS[idx + 1];
    }
  }
  handleBack() {
    const idx = this.currentStepIndex;
    if (idx > 0) {
      this.currentStep = STEPS[idx - 1];
    }
  }

  async handleSubmit() {
    this.isSubmitting = true;
    this.submitError = undefined;
    try {
      const caseId = await createCase({
        subject: this.subject,
        description: this.description,
        priority: this.priority,
        assetId: this.selectedAssetId,
        errorCode: this.errorCode
      });
      // Attach any staged files to the newly created case (sequential to
      // stay within heap/DML limits for the demo).
      for (const f of this.stagedFiles) {
        // eslint-disable-next-line no-await-in-loop
        await saveFile({
          parentId: caseId,
          fileName: f.name,
          base64Data: f.base64
        });
      }
      this.createdCaseId = caseId;
      this.dispatchEvent(
        new CustomEvent("casecreated", { detail: { caseId } })
      );
      this._toast("Support case created successfully", "success");
    } catch (error) {
      this.submitError = error;
      this._toast("Could not create the case", "error");
    } finally {
      this.isSubmitting = false;
    }
  }

  handleViewCase() {
    this[NavigationMixin.Navigate]({
      type: "standard__recordPage",
      attributes: {
        recordId: this.createdCaseId,
        objectApiName: "Case",
        actionName: "view"
      }
    });
  }

  handleStartAnother() {
    this.currentStep = "select";
    this.selectedAssetId = this.preselectedAssetId;
    this.subject = "";
    this.description = "";
    this.priority = "Medium";
    this.errorCode = "";
    this.stagedFiles = [];
    this.createdCaseId = undefined;
    this.submitError = undefined;
  }

  // 7. Getters — steps
  get steps() {
    return [
      { label: "Select Device", value: "select" },
      { label: "Describe Issue", value: "describe" },
      { label: "Attach Files", value: "attach" },
      { label: "Review & Submit", value: "review" }
    ];
  }
  get currentStepIndex() {
    return STEPS.indexOf(this.currentStep);
  }
  get isSelectStep() {
    return this.currentStep === "select";
  }
  get isDescribeStep() {
    return this.currentStep === "describe";
  }
  get isAttachStep() {
    return this.currentStep === "attach";
  }
  get isReviewStep() {
    return this.currentStep === "review";
  }
  get isLastStep() {
    return this.currentStepIndex === STEPS.length - 1;
  }
  get isFirstStep() {
    return this.currentStepIndex === 0;
  }
  get isComplete() {
    return !!this.createdCaseId;
  }

  // 7. Getters — derived data
  get assetOptions() {
    return this.assets.map((a) => ({
      label: a.SerialNumber ? `${a.Name} (${a.SerialNumber})` : a.Name,
      value: a.Id
    }));
  }
  get selectedAsset() {
    return this.assets.find((a) => a.Id === this.selectedAssetId);
  }
  get selectedAssetLabel() {
    const a = this.selectedAsset;
    if (!a) {
      return "";
    }
    return a.SerialNumber ? `${a.Name} (${a.SerialNumber})` : a.Name;
  }
  get hasStagedFiles() {
    return this.stagedFiles.length > 0;
  }
  get fileCountLabel() {
    const n = this.stagedFiles.length;
    return n === 0 ? "No files attached" : `${n} file(s) attached`;
  }

  // 8. Private helpers
  _validateCurrentStep() {
    if (this.isSelectStep && !this.selectedAssetId) {
      this._toast("Please select a device to continue", "warning");
      return false;
    }
    if (this.isDescribeStep) {
      const inputs = Array.from(
        this.template.querySelectorAll(".describe-input")
      );
      return inputs.reduce((valid, input) => {
        input.reportValidity();
        return valid && input.checkValidity();
      }, true);
    }
    return true;
  }

  _readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () =>
        resolve({
          name: file.name,
          size: file.size,
          base64: reader.result.split(",")[1]
        });
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  _toast(message, variant) {
    this.dispatchEvent(new ShowToastEvent({ title: message, variant }));
  }
}
