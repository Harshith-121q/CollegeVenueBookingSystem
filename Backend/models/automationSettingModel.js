import { Schema, model } from "mongoose";

const automationSettingSchema = new Schema({
  key: {
    type: String,
    required: true,
    unique: true,
  },
  enabled: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

export const AutomationSettingModel = model("AutomationSetting", automationSettingSchema);
