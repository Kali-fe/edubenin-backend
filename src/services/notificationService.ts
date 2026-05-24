interface NotificationPayload {
  userId: string;
  message: string;
  type: "INFO" | "SUCCESS" | "WARNING" | "ERROR";
}

/**
 * Service minimal de notification MVP.
 * Ce point est prevu pour integration future BullMQ/Socket.IO.
 */
export const sendNotification = async (_payload: NotificationPayload): Promise<void> => {
  return Promise.resolve();
};
