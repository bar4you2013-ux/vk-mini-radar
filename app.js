const APP_ID = 54808561;

// Известный нам Shop-пост
const TEST_OWNER = -240613485;
const TEST_POST = 8012;

// Версия VK API
const API_VERSION = "5.199";

let accessToken = null;

const logElement =
    document.getElementById("log");


function log(text = "") {

    console.log(text);

    logElement.textContent +=
        text + "\n";
}


function status(id, text) {

    document.getElementById(id)
        .textContent = text;
}


function separator() {

    log(
        "----------------------------------------"
    );
}


function safeJSON(data) {

    // Не выводим access_token в отчёт.

    if (
        data &&
        typeof data === "object"
    ) {

        const copy =
            JSON.parse(
                JSON.stringify(data)
            );

        if (copy.access_token) {

            copy.access_token =
                "*** СКРЫТ ***";
        }

        return JSON.stringify(
            copy,
            null,
            2
        );
    }

    return String(data);
}


// ========================================================
// VK BRIDGE
// ========================================================

async function testBridge() {

    separator();

    log("TEST 1 — VK BRIDGE");

    try {

        const result =
            await vkBridge.send(
                "VKWebAppInit"
            );

        status(
            "bridgeStatus",
            "🟢 VK Bridge"
        );

        log("OK");

        log(
            safeJSON(result)
        );

        return true;

    } catch (error) {

        status(
            "bridgeStatus",
            "🔴 VK Bridge"
        );

        log("ERROR");

        log(
            safeJSON(error)
        );

        return false;
    }
}


// ========================================================
// USER
// ========================================================

async function testUser() {

    separator();

    log("TEST 2 — USER");

    try {

        const user =
            await vkBridge.send(
                "VKWebAppGetUserInfo"
            );

        status(
            "userStatus",
            "🟢 Пользователь"
        );

        log(
            "User ID: " +
            user.id
        );

        log(
            "Имя: " +
            user.first_name
        );

        return true;

    } catch (error) {

        status(
            "userStatus",
            "🔴 Пользователь"
        );

        log(
            safeJSON(error)
        );

        return false;
    }
}


// ========================================================
// AUTH
// ========================================================

async function testAuth() {

    separator();

    log("TEST 3 — AUTH");

    try {

        /*
        Запрашиваем wall.

        Пустой scope специально не используем:
        для него известны проблемы на некоторых клиентах VK.
        */

        const result =
            await vkBridge.send(
                "VKWebAppGetAuthToken",
                {
                    app_id: APP_ID,
                    scope: "wall"
                }
            );

        if (!result.access_token) {

            throw new Error(
                "VK не вернул access_token"
            );
        }

        accessToken =
            result.access_token;

        status(
            "tokenStatus",
            "🟢 Авторизация"
        );

        log(
            "Token: получен"
        );

        log(
            "Scope: " +
            (result.scope || "?")
        );

        return true;

    } catch (error) {

        status(
            "tokenStatus",
            "🔴 Авторизация"
        );

        log("AUTH ERROR:");

        log(
            safeJSON(error)
        );

        return false;
    }
}


// ========================================================
// API
// ========================================================

async function callAPI(
    method,
    params = {}
) {

    if (!accessToken) {

        throw new Error(
            "Нет access token"
        );
    }

    const result =
        await vkBridge.send(
            "VKWebAppCallAPIMethod",
            {
                method: method,

                params: {
                    ...params,

                    access_token:
                        accessToken,

                    v:
                        API_VERSION
                }
            }
        );

    /*
    В зависимости от версии Bridge
    ответ может быть либо response,
    либо объектом с response.
    */

    if (
        result &&
        result.response !== undefined
    ) {

        return result.response;
    }

    return result;
}


// ========================================================
// GET KNOWN POST
// ========================================================

async function testKnownPost() {

    separator();

    log(
        "TEST 4 — ИЗВЕСТНЫЙ SHOP-ПОСТ"
    );

    log(
        "wall" +
        TEST_OWNER +
        "_" +
        TEST_POST
    );

    try {

        const result =
            await callAPI(
                "wall.getById",
                {
                    posts:
                        TEST_OWNER +
                        "_" +
                        TEST_POST
                }
            );

        log(
            safeJSON(result)
        );

        let items = null;

        if (
            result &&
            Array.isArray(result.items)
        ) {

            items =
                result.items;
        }

        else if (
            Array.isArray(result)
        ) {

            items =
                result;
        }


        if (
            !items ||
            items.length === 0
        ) {

            throw new Error(
                "VK не вернул пост"
            );
        }


        const post =
            items[0];


        status(
            "postStatus",
            "🟢 Shop-пост"
        );


        log("");
        log(
            "OWNER: " +
            post.owner_id
        );

        log(
            "POST: " +
            post.id
        );


        if (
            post.views &&
            post.views.count !== undefined
        ) {

            status(
                "viewsStatus",
                "🟢 Views: " +
                post.views.count
            );

            log(
                "VIEWS: " +
                post.views.count
            );
        }

        else {

            status(
                "viewsStatus",
                "🟠 Views отсутствует"
            );

            log(
                "views.count отсутствует"
            );
        }


        return post;

    } catch (error) {

        status(
            "postStatus",
            "🔴 Shop-пост"
        );

        status(
            "viewsStatus",
            "🔴 Views"
        );

        log(
            "wall.getById ERROR:"
        );

        log(
            safeJSON(error)
        );

        return null;
    }
}


// ========================================================
// WALL.GET
// ========================================================

async function testWallGet() {

    separator();

    log(
        "TEST 5 — WALL.GET"
    );

    try {

        const result =
            await callAPI(
                "wall.get",
                {
                    owner_id:
                        TEST_OWNER,

                    count: 10
                }
            );

        status(
            "wallStatus",
            "🟢 wall.get"
        );

        let count = "?";

        if (
            result &&
            Array.isArray(result.items)
        ) {

            count =
                result.items.length;
        }

        log(
            "Получено постов: " +
            count
        );

        log(
            safeJSON(result)
        );

        return result;

    } catch (error) {

        status(
            "wallStatus",
            "🔴 wall.get"
        );

        log(
            "wall.get ERROR:"
        );

        log(
            safeJSON(error)
        );

        return null;
    }
}


// ========================================================
// DISCOVERY TEST
// ========================================================

async function testDiscovery() {

    separator();

    log(
        "TEST 6 — DISCOVERY"
    );

    log(
        "Проверяем newsfeed.search"
    );


    try {

        const result =
            await callAPI(
                "newsfeed.search",
                {
                    q: "Ozon",

                    count: 20
                }
            );


        status(
            "searchStatus",
            "🟢 Discovery ДОСТУПЕН"
        );


        log("");
        log(
            "🔥 NEWSFEED.SEARCH РАБОТАЕТ"
        );


        log(
            safeJSON(result)
        );


        return result;

    } catch (error) {

        status(
            "searchStatus",
            "🔴 Discovery"
        );


        log("");
        log(
            "newsfeed.search ERROR:"
        );


        log(
            safeJSON(error)
        );


        /*
        Это очень важный результат.

        Если здесь снова будет 1051,
        мы будем знать, что Mini App
        это ограничение не снимает.
        */


        return null;
    }
}


// ========================================================
// ALL TESTS
// ========================================================

async function runTests() {

    logElement.textContent = "";

    accessToken = null;


    status(
        "bridgeStatus",
        "⚪ VK Bridge"
    );

    status(
        "userStatus",
        "⚪ Пользователь"
    );

    status(
        "tokenStatus",
        "⚪ Авторизация"
    );

    status(
        "postStatus",
        "⚪ Shop-пост"
    );

    status(
        "viewsStatus",
        "⚪ Views"
    );

    status(
        "wallStatus",
        "⚪ wall.get"
    );

    status(
        "searchStatus",
        "⚪ Discovery"
    );


    log(
        "VK RADAR API TEST"
    );

    log(
        "APP ID: " +
        APP_ID
    );

    log(
        "API: " +
        API_VERSION
    );


    const bridgeOK =
        await testBridge();


    if (!bridgeOK) {

        log("");
        log(
            "СТОП:"
        );

        log(
            "Приложение должно быть " +
            "запущено внутри VK."
        );

        return;
    }


    await testUser();


    const authOK =
        await testAuth();


    if (!authOK) {

        log("");
        log(
            "СТОП:"
        );

        log(
            "Без авторизации API-тесты " +
            "выполнить нельзя."
        );

        return;
    }


    await testKnownPost();

    await testWallGet();

    await testDiscovery();


    separator();

    log(
        "ВСЕ ТЕСТЫ ЗАВЕРШЕНЫ"
    );

    log("");
    log(
        "Можно нажать:"
    );

    log(
        "СКОПИРОВАТЬ РЕЗУЛЬТАТ"
    );
}


// ========================================================
// BUTTONS
// ========================================================

document
    .getElementById(
        "startButton"
    )
    .addEventListener(
        "click",
        runTests
    );


document
    .getElementById(
        "copyButton"
    )
    .addEventListener(
        "click",
        async () => {

            try {

                await navigator
                    .clipboard
                    .writeText(
                        logElement.textContent
                    );

                alert(
                    "Отчёт скопирован"
                );

            } catch (error) {

                alert(
                    "Не удалось скопировать. " +
                    "Выдели текст вручную."
                );
            }
        }
    );