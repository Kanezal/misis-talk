const { User } = require('../database_work');

const bot = require('../main');

function deepCopy(obj) {
    return JSON.parse(JSON.stringify(obj));
}

function addPrefixToCallbackData(options, prefix) {
    options = deepCopy(options)

    for (let row of options.reply_markup.inline_keyboard) {
        for (let button of row) {
            button.callback_data = prefix + button.callback_data;
        }
    }
    return options;
}

const options = {
    reply_markup: {
        inline_keyboard: [
            [
                { text: 'Алгебра', callback_data: 'settings_algebra' },
                { text: 'Матанализ', callback_data: 'settings_calculus' },
            ],
            [
                { text: 'Физика', callback_data: 'settings_physics' },
                { text: 'Программирование', callback_data: 'settings_programming' },
            ],
            // [
            //     { text: "Запомнить", callback_data: "submit"}
            // ]
        ],
    },
};

const subjectMapping = {};
for (let row of options.reply_markup.inline_keyboard) {
    for (let button of row) {
        subjectMapping[button.callback_data] = button.text;
    }
}

module.exports = function settings(msg) {
    const chatId = msg.chat.id;

    let optionsMy = addPrefixToCallbackData(options, 'my_');
    let optionsThey = addPrefixToCallbackData(options, 'they_');

    bot.sendMessage(chatId, 'Выберите предмет, в котором вы разбираетесь:', optionsMy);
    bot.sendMessage(chatId, 'Выберите предмет, для которого вы ищете помощь:', optionsThey);
};

// Обработчик нажатий кнопок

bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const prefix = query.data.split('_')[0];
    const subject = query.data.split('_').pop();

    // Get the user from the database
    bot.sendChatAction(chatId, 'typing');

    const user = await User.findOne({ where: { chatId: chatId } });

    if (!user) {
        // Handle case where user is not found in the database
        bot.sendMessage(chatId, `Ой ой, кажется сначала нужно пройти процесс регистрации.`);
        return;
    }

    // Determine which attribute to update based on the prefix
    const attribute = prefix === 'my' ? 'skills' : 'preferences';

    // Parse the attribute from the database into an array
    let attributeArray = JSON.parse(user[attribute] || '[]');

    // Check if the subject is already in the attribute array
    const index = attributeArray.indexOf(subject);
    if (index !== -1) {
        // If the subject is already in the array, remove it
        attributeArray.splice(index, 1);
    } else {
        // Otherwise, add the selected subject to the attribute array
        attributeArray.push(subject);
    }

    // Sort the attribute array
    attributeArray.sort();

    // Update the user's attribute in the database
    user[attribute] = JSON.stringify(attributeArray);
    await user.save();

    
    // Get the user's skills and preferences
    const skills = JSON.parse(user.skills || '[]').map(skill => subjectMapping["settings_" + skill]);
    const preferences = JSON.parse(user.preferences || '[]').map(pref => subjectMapping["settings_" + pref]);
    
    
    bot.editMessageText(
        `Вы выбрали:\n${prefix === 'my' ? skills.join(', ') : preferences.join(', ')}`, 
        { chat_id: chatId, message_id: query.message.message_id, reply_markup: query.message.reply_markup }
    )
    // // Send a message with the user's skills and preferences
    // bot.sendMessage(chatId, `Что вы умеете: ${skills.join(', ')}\nЧто вы ищите: ${preferences.join(', ')}`);
});