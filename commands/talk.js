const { User } = require('../database_work');

const bot = require('../main');

const usersInSearch = new Set()
const userPairs = new Map();

module.exports = async function settings(msg) {
    const curChatId = msg.chat.id;

    const curUser = await User.findOne({ where: { chatId: curChatId } });

    if (!curUser) {
        // Handle case where user is found in the database
        bot.sendMessage(curChatId, `Такс, похоже вы ещё не зарегестрированы.\nВведите команду /start`);
        return;
    }

    usersInSearch.add(curUser)

    // Тут пока просто случайный поиск, как то так
    await new Promise((resolve, reject) => {
        bot.sendMessage(curChatId, "Начался поиск собеседника. Придется немного подождать...\nВведите /stop, чтобы остановить поиск.")

        // bot.once('message', (msg) => {
        //     if (msg.text == "/stop") {
        //         bot.sendMessage(curChatId, "Окей, останавливаем поиск.")
        //         reject("Поиск был прекращен.");
        //     }
        // });

        let randomUser;

        var intervalId = setInterval((callback) => {
            let usersArray = Array.from(usersInSearch);
            randomUser = usersArray[Math.floor(Math.random() * usersArray.length)]

            // if (!usersArray.find((el) => el === curUser)) {
            //     resolve(userPairs.get(curChatId))
            // }

            if (randomUser.chatId !== curUser.chatId) {
                try {
                    for (let user of usersInSearch) {
                        if (user.chatId === curChatId) {
                            usersInSearch.delete(user);
                        } else if (user.chatId === randomUser.chatId) {
                            usersInSearch.delete(randomUser);
                        }
                    }

                    userPairs.set(curChatId, parseInt(randomUser.chatId));
                    userPairs.set(parseInt(randomUser.chatId), curChatId);
                
                    clearInterval(intervalId);
                    resolve(randomUser.chatId)
                } catch (er) {
                    setTimeout(() => resolve(userPairs.get(curChatId)), 500)
                }   
            }
        }, 1500)
    })
    .then(async (pairedChatId) => {
        const parterChatId = pairedChatId
        bot.sendMessage(curChatId, "Собеседник найден! Приступайте к общению...")
        console.log(curChatId, pairedChatId)

        while (true) {
            // await (new Promise((resolve, reject) => {
            //     bot.once('message', (msg) => {
            //         console.log(msg.from.id)
            //         if (msg.from.id == pairedChatId) {
            //             console.log("Я ПИДАРАС")
            //             return;
            //         }

            //         console.log(msg)

            //         if (msg.text == "/stop") {
            //             bot.sendMessage(curChatId, "Окей, останавливаем поиск.")
            //             // bot.sendMessage(userPairs.get(curChatId), "Собеседник оборвал связь :(")
            //             userPairs.delete(curChatId);  // Remove the pair
            //             userPairs.delete(userPairs.get(curChatId)); // Remove the pair from the other side as well
            //             reject()
            //         };

            //         console.log(pairedChatId)
            //         bot.sendMessage(pairedChatId, msg.text);
            //         resolve()
            //     });
            // }))

            try {
                await new Promise((resolve, reject) => {
                    bot.once('message', (msg) => {
                        if (msg.from.id != pairedChatId && msg.from.id != curChatId) {
                            reject("Chat ERROR => используем костыли")
                        }

                        if (msg.from.id == parterChatId) {
                            reject("Chat ERROR => используем костыли")
                        }

                        if (!userPairs.get(curChatId)) {
                            resolve()
                        }

                        if (msg.text == "/stop") {
                            bot.sendMessage(curChatId, "Связь была разорвана.")
                            // bot.sendMessage(userPairs.get(curChatId), "Собеседник оборвал связь :(")
                            userPairs.delete(curChatId);  // Remove the pair
                            userPairs.delete(parterChatId); // Remove the pair from the other side as well
                            resolve();
                        };

                        reject(msg.text);
                    });
                });
                break;
            } catch (text) {
                if (text != "Chat ERROR => используем костыли") {
                    bot.sendMessage(parterChatId, text);
                }
            }
        }
    })
    // .catch((reason) => bot.sendMessage(chatId, reason))
};