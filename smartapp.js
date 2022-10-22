const SmartApp = require('@smartthings/smartapp');
const colors = require('./constants/colors');

//------------------------------Define the SmartApp ------------------------------
module.exports = new SmartApp()
    .configureI18n({updateFiles: true}) // Enable translations and update translation file when new items are added.
    .enableEventLogging(2) // Logging for testing.
    .page('mainPage', (context, page, configData) => {
        //---Connecting devices------------------------------------------

        page.section('PcLedStrip', section => {
            section
                .deviceSetting('PcLedStrip')
                .capabilities(['colorControl', 'switch'])
                .permissions('rx')
                .required(true)
        });

        page.section('PcRgbLight', section => {
            section
                .deviceSetting('PcRgbLight')
                .capabilities(['colorControl', 'switch'])
                .permissions('rx')
                .required(true);
        });
    })

    .updated(async (context, updateData) => {
        // Updated defines what code to run when the SmartApp is installed or the settings are updated by the user.

        // Clear any existing configuration.
        await context.api.schedules.delete()
        await context.api.subscriptions.delete()

        //Subscribe to events
        await context.api.subscriptions.subscribeToDevices(context.config.PcLedStrip, 'switch', 'switch', 'pcLedStripSwitchHandler')
        await context.api.subscriptions.subscribeToDevices(context.config.PcLedStrip, 'colorControl', 'hue', 'pcLedStripHueHandler')

    })

    .subscribedEventHandler('pcLedStripHueHandler', async (context, event) => {
        stripStatus = await context.api.devices.getCapabilityStatus(context.config.PcLedStrip[0].deviceConfig.deviceId, 'main', 'colorControl')
        satValue = stripStatus.saturation.value
        hueValue = stripStatus.hue.value
        if (satValue !== 0) {
            //Setting hue to PC light
            changeColor(context, context.config.PcRgbLight, satValue, hueValue)
        } else{
            //Setting color temp
            changeColorTemp(context, context.config.PcRgbLight, satValue, hueValue)
        }
    })

    .subscribedEventHandler('pcLedStripSwitchHandler', async (context, event) => {
        if(event.value === 'on'){
            context.api.devices.sendCommands(context.config.PcRgbLight, 'switch', 'on')
        }
        else {
            context.api.devices.sendCommands(context.config.PcRgbLight, 'switch', 'off')
        }
    })

async function changeColor(context, device, saturation, hue) {
    // Send command to the SmartThings API.
    await context.api.devices.sendCommands(device, [
        {
            capability: 'switch',
            command: 'on'
        },
        {
            capability: 'colorControl',
            command: 'setColor',
            arguments: [{
                hue: hue,
                saturation: saturation
            }]
        }
    ]);
}

async function changeColorTemp(context, device) {
    // Send command to the SmartThings API.
    await context.api.devices.sendCommands(device, [
        {
            capability: 'colorTemperature',
            command: 'setColorTemperature',
            arguments: [6500]
        }
    ]);
}