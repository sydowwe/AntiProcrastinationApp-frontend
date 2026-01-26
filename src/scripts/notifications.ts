export function showNotification(title: string, message: string) {
    if (Notification.permission === 'granted') {
      const notification = new Notification(title, { body: message });
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
      notification.onerror = (e: Event) => {
        console.log('Notification error:', e);
      };
    } else if (Notification.permission === 'default') {
      checkNotificationPermission();
    }
  }
  export function checkNotificationPermission() {
    if (Notification.permission === 'default') {
        Notification.requestPermission();
    }
  }