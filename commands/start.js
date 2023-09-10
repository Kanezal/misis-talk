const nodemailer = require('nodemailer');
const { User } = require('../database_work');

const bot = require('../main');
const { GMAIL_USER, GMAIL_PASS } = require('../config.dev.json');

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: GMAIL_USER,
        pass: GMAIL_PASS,
    },
});

const generateCode = () => {
    return Math.floor(100000 + Math.random() * 900000); // generates a six digit number
};

const verificationProcesses = {};

module.exports = async function handleStart(msg) {
    const chatId = msg.chat.id;

    const user = await User.findOne({ where: { chatId: chatId } });
    
    if (user) {
        // Handle case where user is found in the database
        bot.sendMessage(chatId, `Такс, похоже вы уже зарегестрированы.`);
        return;
    }

    // Начало регистрации
    if (!verificationProcesses[chatId]) {
        verificationProcesses[chatId] = { step: 'email', code: generateCode() };

        bot.sendMessage(chatId,
            `Привет! Я - чат-бот НИТУ МИСИС для поиска study-buddy!\nЯ буду твоим проводником к новым знакомствам в университете.`
        );
    } else { return }

    const process = verificationProcesses[chatId];

    const sendEmail = async (email, subject, text) => {
        try {
            await transporter.sendMail({
                from: GMAIL_USER,
                to: email,
                subject: subject,
                text: text,
            });
            console.log('Email sent successfully');
        } catch (error) {
            console.error('Error sending email:', error);
        }
    };

    const handleEmail = () => {
        return new Promise((resolve, reject) => {
            bot.sendMessage(chatId, "Давай начнем с регистрации! Пожалуйста, введи адрес корпоративной почты МИСИС:");

            bot.once('message', (msg) => {
                if (msg.from.id != chatId) {
                    
                }

                process.email = msg.text;

                let emailRegex = /^[a-zA-Z0-9._%+-]+@edu\.misis\.ru$/;

                if (emailRegex.test(process.email)) {
                    resolve();
                } else {
                    reject('Упс... Кажется, это не совсем почта МИСИС. Попробуем еще раз?')
                }
            });
        });
    };

    const handleCode = () => {
        return new Promise((resolve, reject) => {
            bot.sendMessage(chatId, 'Супер! Теперь тебе на почту придет код подтверждения, его тоже нужно ввести:');

            bot.once('message', (msg) => {
                if (msg.text == process.code) {
                    resolve();
                } else {
                    reject('Упс... Кажется, введеный код не очень совпадает с тем, который на почте. Попробуем еще раз?')
                }
            });
        });
    };


    // Основной цикл событий
    while (true) {
        try {
            await handleEmail();
            break;
        } catch (error) {
            bot.sendMessage(chatId, error);
        }
    }

    sendEmail(process.email, "MISIS Talk | Код", `Ваш код для завершения регистрации:\n${process.code}`);

    while (true) {
        try {
            await handleCode();
            break;
        } catch (error) {
            bot.sendMessage(chatId, error);
        }
    }

    while (true) {
        try {
            await User.create({ email: process.email, chatId: chatId, skills: '', preferences: '' });
            bot.sendMessage(chatId, 'Регистрация завершена! Теперь введи команду /settings чтобы выбрать свои интересы для поиска.');
            delete verificationProcesses[chatId];
            break;
        } catch (e) {
            console.error(e);
            bot.sendMessage(chatId, 'Так так стоп. Похоже ты уже зарегестрирован :)');
            break;
        }
    }


    // handleEmail()
    //     .catch( error => handleEmail(msg) )

    //     .then(handleCode)
    //         .catch( error => handleCode(msg))

    //     .then(async () => {
    //         try {
    //             await User.create({ email: process.email, chatId: chatId, skills: '', preferences: '' });
    //             bot.sendMessage(chatId, 'Регистрация завершена! Теперь введи команду /settings чтобы выбрать свои интересы для поиска.');
    //             delete verificationProcesses[chatId];
    //         } catch (e) {
    //             console.error(e);
    //             bot.sendMessage(chatId, 'Упс... Кажется, что-то пошло не так. Попробуем еще раз?');
    //         }
    //     })
    //         .catch((error) => {
    //             bot.sendMessage(chatId, error);
    //             handleStart(msg); // Restart the process if there was an error
    //         });    
};
