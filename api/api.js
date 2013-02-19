YUI.add("yuidoc-meta", function(Y) {
   Y.YUIDoc = { meta: {
    "classes": [
        "App",
        "DeferredResponse",
        "Events",
        "Inheritance",
        "Middleware",
        "MiddlewarePrototype",
        "RequestClient",
        "RequestGhost",
        "RequestPromise",
        "Router",
        "SockjsClient",
        "SockjsServer",
        "Utils"
    ],
    "modules": [
        "Promises",
        "midsockets"
    ],
    "allModules": [
        {
            "displayName": "midsockets",
            "name": "midsockets"
        },
        {
            "displayName": "Promises",
            "name": "Promises",
            "description": "The class of the object passed as `res` to Router event handlers. When the\ndeferredResponse is resolved, the data is sent to the corresponding RequestPromise\non the client."
        }
    ]
} };
});