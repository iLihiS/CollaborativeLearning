import { fileUploadService, llmService, emailService } from './apiClient';

// Export core services
export const Core = {
  UploadFile: fileUploadService.uploadFile.bind(fileUploadService),
  InvokeLLM: llmService.invoke.bind(llmService),
  SendEmail: emailService.sendEmail.bind(emailService),
  GenerateImage: async (prompt, options = {}) => {
    // You can integrate with services like OpenAI DALL-E, Midjourney, or Stable Diffusion
    return llmService.invoke(`Generate an image: ${prompt}`, { type: 'image', ...options });
  },
  ExtractDataFromUploadedFile: async (fileUrl, options = {}) => {
    // You can integrate with OCR services or document parsing APIs
    return llmService.invoke(`Extract data from file: ${fileUrl}`, { type: 'extraction', ...options });
  }
};

// Export individual functions for backward compatibility
export const UploadFile = Core.UploadFile;
export const InvokeLLM = Core.InvokeLLM;
export const SendEmail = Core.SendEmail;
export const GenerateImage = Core.GenerateImage;
export const ExtractDataFromUploadedFile = Core.ExtractDataFromUploadedFile;






