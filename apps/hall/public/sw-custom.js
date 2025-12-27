self.addEventListener('push', function (event) {
    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body,
            icon: data.icon || '/icon-192x192.png', // Verifique se este ícone existe
            badge: '/badge.png', // Ícone pequeno para barra de status (opcional)
            vibrate: [100, 50, 100],
            data: {
                dateOfArrival: Date.now(),
                primaryKey: '1',
                url: data.url
            },
            // Actions para interatividade (opcional)
            // actions: [
            //     {action: 'explore', title: 'Ver detalhes', icon: '/checkmark.png'},
            //     {action: 'close', title: 'Fechar', icon: '/xmark.png'},
            // ]
        };
        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    }
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    // Abre a URL ao clicar
    if (event.notification.data && event.notification.data.url) {
        event.waitUntil(
            clients.openWindow(event.notification.data.url)
        );
    } else {
        // Default url
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});
