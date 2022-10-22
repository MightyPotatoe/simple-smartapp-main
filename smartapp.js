const SmartApp = require('@smartthings/smartapp');
const colors = require('./constants/colors');

async function randomColorSwitch(context) {
  // Return a random color from the colors object.
  const randomColor = function (colors) {
    const keys = Object.keys(colors);
    return colors[keys[ keys.length * Math.random() << 0]];
  };

  // Get a random color.
  const color = randomColor(colors);

  // Send command to the SmartThings API.
  await context.api.devices.sendCommands(context.config.lightSwitch, [
    {
      capability: 'switch',
      command: 'on'
    },
    {
      capability: 'switchLevel',
      command: 'setLevel',
      arguments: [100] // TODO: can we use the rate to fade between changes?
    },
    {
      capability: 'colorControl',
      command: 'setColor',
      arguments: [color]
    }
  ]);
}

/* Define the SmartApp */
module.exports = new SmartApp()
  .configureI18n({updateFiles: true}) // Enable translations and update translation file when new items are added.
  .enableEventLogging(2) // Logging for testing.
  .page('mainPage', (context, page, configData) => {
    // Define SmartApp page sections.
    //Select Button
    page.section('button', section => {
    			section
    				.deviceSetting('button')
    				.capabilities(['button'])
    				.required(true)
    		})

     page.section('ledStrip', section => {
        			section
        				.deviceSetting('ledStrip')
        				.capabilities(['colorControl'])
        				.permissions('rx')
        				.required(true)
        		})

    // These are the sections for user input.
    page.section('checkDuration', section => {
      section
        .enumSetting('lightCheckDuration')
        .options([
          { id: '1', name: '1 Minute' },
          { id: '2', name: '2 Minutes' },
          { id: '5', name: '5 Minutes' }
        ])
        .defaultValue('1');
    });
    page.section('lightSwitch', section => {
      section
        .deviceSetting('lightSwitch')
        .capabilities(['switch'])
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
    await context.api.subscriptions.subscribeToDevices(context.config.button, 'button', 'button', 'pcButtonHandler')
    await context.api.subscriptions.subscribeToDevices(context.config.ledStrip, 'colorControl', 'hue', 'pcLedStripHueHandler')


    // Set initial switch toggle.
    await randomColorSwitch(context);

    // Schedule future toggle checks.
    await context.api.schedules.schedule(
      'lightScheduleHandler', 
      `0/${context.configStringValue('lightCheckDuration')} * * * ? *`, 
      'UTC'
    );
  })
  .subscribedEventHandler('pcButtonHandler', async (context, event) => {
    if(event.value === 'pushed'){
        context.api.devices.sendCommands(context.config.lightSwitch, 'switch', 'on')
        turnOn(context)
    }
    else if(event.value === 'held'){
        context.api.devices.sendCommands(context.config.lightSwitch, 'switch', 'off')
        context.api.devices.sendCommands(context.config.ledStrip, 'switch', 'off')
    }
  })

   .subscribedEventHandler('pcLedStripHueHandler', async (context, event) => {
       context.api.devices.sendCommands(context.config.lightSwitch, 'switch', 'on')
       console.log('*************************************************************************************************')
       console.log('*************************************************************************************************')
//       objjson = JSON.parse(context.config.ledStrip)
       stripStatus = await context.api.devices.getCapabilityStatus(context.config.ledStrip[0].deviceConfig.deviceId, 'main', 'colorControl')
       satValue = stripStatus.saturation.value
       hueValue = stripStatus.hue.value
       changeColor(context, satValue, hueValue)

//       object = context.config.ledStrip
//       console.log(object)
       console.log('*************************************************************************************************')
       console.log('*************************************************************************************************')

   })

  .scheduledEventHandler('lightScheduleHandler', async (context, event) => {
    // Every duration chosen by user, toggle the light switch.
//    randomColorSwitch(context);
  });

  async function turnOn(context){

  const randomColor = function (colors) {
      const keys = Object.keys(colors);
      return colors[keys[ keys.length * Math.random() << 0]];
    };

    // Get a random color.
    const color = randomColor(colors);

  // Send command to the SmartThings API.
    await context.api.devices.sendCommands(context.config.ledStrip, [
      {
            capability: 'switch',
            command: 'on'
          },
          {
            capability: 'colorControl',
            command: 'setColor',
            arguments: [{
                hue: 10,
                saturation: 50
            }]
          }
        ]);
  }

  async function changeColor(context, saturation, hue){
    // Send command to the SmartThings API.
        await context.api.devices.sendCommands(context.config.lightSwitch, [
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