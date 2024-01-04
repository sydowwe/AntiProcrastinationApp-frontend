export function showNotification(title: string, message: string) {
    if (Notification.permission === 'granted') {
      console.log(title);
      
      const notification = new Notification(title, { body: message });
      notification.onclick = () => {
        console.log('asdds');
      }
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