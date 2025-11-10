'use strict'

const fs            = require('fs');
const {SMTPServer}  = require('smtp-server');
const simpleParser  = require('mailparser').simpleParser;
const mqtt          = require('mqtt');

const config = {};

if (fs.existsSync('/data/options.json')) {
   config    = JSON.parse(fs.readFileSync('/data/options.json', 'utf8'));
//} else {
//    const config    = {};
}

const mqttUrl       = config.mqtt_url || 'mqtt://core-mosquitto:1883';
const mqttOptions   = {
                        clientId: config.mqtt_clientId || 'yoosee2mqtt',
                        username: config.mqtt_username || 'mqtt',
                        password: config.mqtt_password || 'mqtt'
                    }
const smtpPort      = config.smtp_port || 25;
const smtpHost      = config.smtp_host || '0.0.0.0';
//const smtp_username      = config.smtp_username || 'username';
//const smtp_password      = config.smtp_password || 'password';

const deviceId      = config.device_id || '0';
const deviceInfo    = {
                        "name": "Yoosee Doorbell SD-05",
                        "manufacturer": "Yoosee",
                        "model": "SD-05",
                        "identifiers": deviceId,
                        //"sw_version": "13.0.5"
                    };

const smtp = new SMTPServer({
    secure: false,
    disabledCommands: ['STARTTLS'],
    //onConnect,
    onAuth,
    //onMailFrom,
    //onRcptTo,
    onData,
    //onClose,
    authOptional: true
});

smtp.listen(smtpPort, smtpHost, () => {
    console.log('Mail server started at %s:%s', smtpHost, smtpPort);
    // mqtt discovery
    let mqttClient = mqtt.connect(mqttUrl, mqttOptions);
    mqttClient.on('connect', function() {
        var doorbellButton = {
                                "name": "Button",
                                "unique_id": "yoosee_" + deviceId + "_button",
                                "device": deviceInfo,
                                "state_topic": "yoosee2mqtt/doorbell/" + deviceId + "/state",
                                "off_delay": "5",
                                "payload_on": "ON",
                                "payload_off": "OFF",
                                "value_template": "{{ value_json.button }}"
                            };
        mqttClient.publish('homeassistant/binary_sensor/doorbell/' + deviceId + '/config', JSON.stringify(doorbellButton), { qos:0, retain: true });

        var doorbellCamera = {
            "name": "Snapshot",
            "unique_id": "yoosee" + deviceId + "_snapshot",
            "device": deviceInfo,
            "topic": "yoosee2mqtt/doorbell/" + deviceId + "/snapshot",
            "image_encoding": "b64"
            };
        mqttClient.publish('homeassistant/camera/doorbell/' + deviceId + '/config', JSON.stringify(doorbellCamera), { qos: 0, retain: true });
        mqttClient.end();
    });
});

// Обработка данных письма
function onData(stream, session, callback) {
    simpleParser(stream).then(function(mail_object) {
    //console.log("From:", mail_object.from.value);
    //console.log("Subject:", mail_object.subject);
    //console.log('Body:', mail_object.text); // or parsed.html for HTML content
    //console.log('Attachments Length:', mail_object.attachments.length);

    for (let i in mail_object.attachments) {
        let attachment = mail_object.attachments[i];
        if(attachment.size !== 0){
            var mqttSensorData = { "button": "ON" };
            var mqttCameraData = Buffer.from(attachment.content, 'utf-8'); // В буфере изображение
            let mqttClient = mqtt.connect(mqttUrl, mqttOptions);
            mqttClient.on('connect', function() {
                mqttClient.publish('yoosee2mqtt/doorbell/' + deviceId + '/state', JSON.stringify(mqttSensorData), { qos: 0 });
                mqttClient.publish('yoosee2mqtt/doorbell/' + deviceId + '/snapshot', mqttCameraData.toString('base64'), { qos: 0 });
                mqttClient.end();
            });
            }
        }
    }).catch(function(error) {
        console.log('An error occurred:', error.message);    
    });
    callback();
};

// Проверка авторизации
function onAuth(auth, session, callback) {
    /*  Будет реализована в следующих релизах
    if (config.anonymous === true && (auth.username !== smtp_username || auth.password !== smtp_password)) {
        return callback(new Error("Invalid username or password"));
    }*/
    return callback(null, { user: 123 /* auth.username */ });
}

// Валидация получателя. Для каждого адреса функция вызывается отдельно.
function onRcptTo({address}, session, callback) {
if (address.startsWith('mqtt@')) {
    callback(new Error(`Address ${address} is not allowed receiver`));
}
else {
    callback();
}
}
// Валидация отправителя
function onMailFrom({address}, session, callback) {
    if (address.startsWith('doorbell@')) {
        callback();
    }
    else {
        callback(new Error(`Address ${address} is not allowed.`));
    }
}

// Подключаемся к mqtt при коннекте к smtp
function onConnect(session, callback) {
    callback();
};
