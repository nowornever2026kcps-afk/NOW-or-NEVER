const CACHE_NAME = "now-or-never-v1";

self.addEventListener("install", event => {
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    self.clients.claim()
  );
});


/* =========================================================
   PUSH NOTIFICATION
   ========================================================= */

self.addEventListener("push", event => {

  let data = {};

  try {
    data = event.data
      ? event.data.json()
      : {};
  } catch (error) {
    console.error(
      "Push data error:",
      error
    );
  }


  const title =
    data.title ||
    "NOW-or-NEVER";


  const options = {

    body:
      data.body ||
      "You have a new notification.",

    icon:
      data.icon ||
      "/NOW-or-NEVER/logo.png",

    badge:
      data.badge ||
      "/NOW-or-NEVER/logo.png",

    tag:
      data.tag ||
      "now-or-never",

    data: {
      url:
        data.url ||
        "/NOW-or-NEVER/"
    }

  };


  event.waitUntil(
    self.registration.showNotification(
      title,
      options
    )
  );

});


/* =========================================================
   NOTIFICATION CLICK
   ========================================================= */

self.addEventListener(
  "notificationclick",
  event => {

    event.notification.close();


    const targetUrl =
      event.notification.data?.url ||
      "/NOW-or-NEVER/";


    event.waitUntil(

      clients.matchAll({
        type: "window",
        includeUncontrolled: true
      }).then(clientList => {

        for (const client of clientList) {

          if (
            "focus" in client
          ) {

            client.navigate(
              targetUrl
            );

            return client.focus();

          }

        }


        if (
          clients.openWindow
        ) {

          return clients.openWindow(
            targetUrl
          );

        }

      })

    );

  }
);
