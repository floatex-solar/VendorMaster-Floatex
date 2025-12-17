// whatsappService.js
import axios from "axios";
import appConfig from "../config/app-config.js";

const { WHATSAPP_API_KEY, WHATSAPP_API_URL } = appConfig;

export const sendWhatsAppMessage = async ({
  receiverMobileNo,
  filePathUrl = [],
  message = [],
}) => {
  try {
    // Validate required parameters
    if (!receiverMobileNo) {
      throw new Error("receiverMobileNo is required");
    }

    // Validate API configuration
    if (!WHATSAPP_API_URL || !WHATSAPP_API_KEY) {
      throw new Error("WhatsApp API configuration is missing");
    }

    // Prepare the request payload
    const payload = {
      receiverMobileNo,
      filePathUrl: Array.isArray(filePathUrl) ? filePathUrl : [filePathUrl],
      message: Array.isArray(message) ? message : [message],
    };

    // Make the API request
    const response = await axios.post(WHATSAPP_API_URL, payload, {
      headers: {
        accept: "application/json",
        "x-api-key": WHATSAPP_API_KEY,
        "Content-Type": "application/json",
      },
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("WhatsApp API Error:", error);
    return {
      success: false,
      error: error.response ? error.response.data : error.message,
    };
  }
};
