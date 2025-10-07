

export type Language = 'en' | 'ru';

const translations: { [lang in Language]: { [key: string]: string } } = {
  en: {
    'app.description': 'Easily change outfits, edit details, or change the style of images. Just draw a mask and add your touch.',
    'app.telegram_link_text': 'Join the Telegram channel',
    'app.bot_link_text': 'Use the Banana Crunch bot for prompts',
    'log.title': 'Action Log',
    'log.empty': 'No entries yet. Start generating to see the log.',
    'log.action.start_generation': 'Starting generation process...',
    'log.action.start_enhance': 'Starting enhancement process...',
    'log.action.start_rtx': 'Starting RTX generation...',
    'log.action.start_mix': 'Starting layer mix process...',
    'log.action.start_ref': 'Starting REF generation...',
    'log.action.start_rep': 'Starting REP generation...',
    'log.magic_prompt_active': '"Magic Prompt" activated. Improving the prompt...',
    'log.magic_prompt_success': 'Prompt successfully enhanced.',
    'log.magic_prompt_fail': 'Failed to enhance prompt, using original.',
    'log.magic_prompt_fail_json': 'Failed to parse enhanced prompt from model, using original.',
    'log.magic_prompt_error': 'Error enhancing prompt: {message}',
    'error.no_annotations_or_prompt': 'Please add annotations or write an instruction to generate an image.',
    'error.blocked_by_safety': 'Your request was blocked for safety reasons (Reason: {reason}). Please change your prompt or annotations.',
    'error.model_no_response': 'The model did not provide a response. This could be due to server overload or an internal error. Please try again.',
    'error.content_blocked_by_safety': 'The generated content was blocked for safety reasons. Please change your prompt to comply with safety policies.',
    'error.model_no_image': 'The model did not return an image in its response. Try changing your annotations or prompt to be clearer.',
    'error.image_load_fail': 'Failed to load the generated image data. The data from the API might be corrupted.',
    'error.unknown': 'An unknown error occurred.',
    'error.api_error_prefix': 'API Error:',
    'error.no_image_to_download': 'No image selected for download.',
    'error.ref_image_fail': 'Failed to process reference images.',
    'error.no_image_to_enhance': 'Please select an image to enhance.',
    'error.no_image_to_mix': 'Please select one image to mix.',
    'error.magic_prompt_generate_fail': 'Magic Prompt failed to generate an idea. Please try again or enter a prompt.',
    'error.mic_blocked': "Microphone access is blocked. Please enable it in your browser settings to use voice control.",
    'error.cam_blocked': 'Camera access is blocked. Please enable it in your browser settings to use the camera.',
    'button.back': 'Back',
    'loading.thinking': 'AI is thinking...',
    'loading.enhancing': 'Enhancing image...',
    'loading.creating_annotations': 'Creating annotations...',
    'loading.improving_prompt': 'Improving prompt...',
    'loading.generating_image': 'Generating image...',
    'loading.generating_mixed_scene': 'Generating mixed scene...',
    'loading.rtx': 'Applying RTX...',
    'uploader.drag_and_drop': 'Drag & drop an image here',
    'uploader.or': 'or',
    'uploader.upload_file': 'Upload a file',
    'toolbar.left.home': 'Home',
    'toolbar.left.add_layer': 'Add Layer',
    'toolbar.left.brush': 'Brush',
    'toolbar.left.lasso': 'Lasso',
    'toolbar.left.arrow': 'Arrow',
    'toolbar.left.text': 'Text',
    'toolbar.left.enhance': 'Render details',
    'toolbar.rtx': 'Improve 3D graphics',
    'toolbar.mix': 'Mix (combine collage into a scene)',
    'toolbar.ref': 'Reference - Creates something in this style',
    'toolbar.rep': 'Replica - Creates a new version of this image',
    'toolbar.edit_image': 'Edit Image',
    'toolbar.left.color_picker_title': 'Select color',
    'toolbar.right.undo': 'Undo',
    'toolbar.right.redo': 'Redo',
    'toolbar.right.clear_sketches': 'Clear Sketches',
    'toolbar.right.selection': 'Select & Move',
    'toolbar.right.hand': 'Hand',
    'toolbar.right.focus': 'Focus',
    'toolbar.right.log': 'Log',
    'toolbar.right.info': 'Info',
    'toolbar.right.delete_image': 'Delete Image',
    'toolbar.right.ui_lang_title': 'Interface Language',
    'toolbar.actions': 'Actions',
    'toolbar.actions_tooltip': 'Universal instructions',
    'generate_bar.placeholder': 'Describe the desired changes...',
    'generate_bar.add_image': 'Add Image',
    'generate_bar.camera': 'Camera',
    'generate_bar.download': 'Download',
    'generate_bar.presets_beta': 'Presets',
    'generate_bar.magic_prompt': 'Magic',
    'generate_bar.magic_mode_active': 'Magic',
    'generate_bar.bad_mode': 'Bad Mode',
    'generate_bar.bad_mode_active': 'Bad',
    'generate_bar.reasoning': 'Reasoning',
    'generate_bar.reasoning_mode': 'Reasoning Mode',
    'generate_bar.reasoning_mode_active': 'Reasoning',
    'generate_bar.expand_prompt': 'Expand Prompt Editor',
    'generate_bar.clear_prompt': 'Clear Prompt',
    'generate_bar.button_generating': 'Generating...',
    'generate_bar.button_reasoning_loading': 'Reasoning...',
    'generate_bar.button_generate': 'Generate',
    'generate_bar.button_generate_outpainting': 'Confirm & Generate',
    'presets.title': 'Prompt Presets',
    'presets.search_placeholder': 'Search presets...',
    'presets.tags.all': 'All',
    'presets.tags.character': 'Character',
    'presets.tags.environment': 'Environment',
    'presets.tags.style': 'Stylization',
    'presets.tags.retouch': 'Retouch',
    'presets.tags.composition': 'Composition',
    'presets.tags.design': 'Design',
    'presets.tags.d3': '3D',
    'text_editor.placeholder': 'Text...',
    'text_editor.cancel_title': 'Cancel',
    'text_editor.align_left_title': 'Align left',
    'text_editor.align_center_title': 'Align center',
    'text_editor.align_right_title': 'Align right',
    'text_editor.confirm_title': 'Confirm',
    'text_editor.color_picker_title': 'Select color',
    'editor.confirm_edits': 'Confirm Edits',
    'prompt_modal.title': 'Edit Prompt',
    'prompt_modal.save': 'Save',
    'prompt_modal.cancel': 'Cancel',
    'workspace.aspect_ratio_edit': 'Aspect Ratio Editor',
    'workspace.change_bg_color': 'Change Background Color',
    'workspace.regenerate': 'Regenerate',
    'workspace.crop': 'Crop',
    'changelog.title': "What's New",
    'changelog.v2_2.title': 'V2.2',
    'changelog.v2_2.subtitle': 'New Actions, Voice Control & Major UX Upgrades',
    'changelog.v2_2.features': `
- **Image Actions Dropdown:** A completely new and updated quick actions menu. With more actions available, they are now neatly organized in a dropdown list.
- **Enhance V2:** The instruction for this action has been improved, resulting in more frequent success and better detail rendering.
- **RTX v2:** This instruction has also been improved. It's similar to Enhance but is more focused on 3D graphics, adding realistic lighting and reflections.
- **Reference (New Action):** Allows you to generate objects, living beings, and scenes from a given world with the same style. You can also specify what you want in the prompt, for example, "a cat".
- **Replica (New Action):** Creates a new image by describing the selected image with a prompt, essentially reinventing the existing image.
- **Aspect Ratio Editor Overhaul:** @muxastarikov has significantly upgraded this mode. You can now choose a transparent area, a crop function has been added, and you can zoom in and out with the mouse wheel. You can also drag the sides for the most flexible aspect ratios.
- **Prompt Builder Update:** All additional functions are now under a '+' button, similar to ChatGPT. A 'Ratio' option has been added for generating images with a specific aspect ratio.
- **Voice Control:** @muxastarikov has added voice-based image creation and editing. Be careful, as it consumes API quota quickly.
- **Reasoning Mode:** 'Reasoning' is now a toggleable mode. You can enable it with the 'R' hotkey and continuously generate images with auto-arrows.
- **Bad Mode (Experimental):** A new experimental mode has been added to soften censorship. It is very unstable and currently works poorly.
- **Webcam Capture:** The ability to take photos with your webcam has been added.
- **Header Redesign:** The header now has a glassmorphism background. A new menu has appeared where various informational and cosmetic settings will be placed.
- **Corner Customization:** @muxastarikov added UI corner rounding customization for fans of sharp edges.
- **Mobile Version:** @muxastarikov has also created a mobile version, so the application can now be used on mobile phones and possibly on touchpads.
`,
    'changelog.v2_0.title': 'V2.0',
    'changelog.v2_0.subtitle': 'The Grand Redesign & Pro-Tips Update',
    'changelog.v2_0.features': `
- Complete UI Overhaul: The entire application has been redesigned with a modern, sleek interface for a more intuitive and enjoyable creative process.
- Advanced Presets Library: Massively expanded the presets with hundreds of new, highly specific prompts for professional use cases.
- Full Layer Support: The editor now supports adding, moving, and resizing image layers, giving you precise control over your compositions.
- Drag & Drop / Paste: You can now add images directly to the canvas by dragging them from your desktop or pasting with Ctrl+V.
- New 'Enhance' & 'RTX' tools: Instantly improve image quality, detail, and lighting with a single click on the floating toolbar.
- Aspect Ratio Editor: Non-destructively change an image's aspect ratio and let the AI intelligently fill in (outpaint) the new areas.
- Tooltips Everywhere: Hover over any button or control to see a helpful tooltip explaining its function and hotkey.
- New Info Knowledge Base: The 'Info' modal has been completely rewritten into a comprehensive guide covering every tool, feature, pro-tip, and hotkey.
- Header Redesign: The main header has been reorganized for better ergonomics.
- Floating Action Buttons: A clean set of action buttons now appears above any selected image for quick access.
- Interactive Changelog: The "What's New" section is now an interactive accordion.
`,
    'changelog.v1_5_1.title': 'V1.5.1',
    'changelog.v1_5_1.subtitle': 'The Enhance Update & Smarter AI',
    'changelog.v1_5_1.features': `
- New "Enhance" feature! Click the pixel icon on the left toolbar to make the image more detailed. Perfect for improving low-quality source images.
- The AI now has a better understanding of layers.
- The internal instructions for "Magic" have been refined, leading to more accurate and relevant prompt enhancements.
`,
    'changelog.v1_5.title': "V1.5",
    'changelog.v1_5.subtitle': "The \"Reasoning\" Update: See the AI's Plan!",
    'changelog.v1_5.features': `
- Introducing the "Reasoning" button! Click it, and the AI will analyze your prompt and draw its plan directly on the image with arrows and text annotations.
- Each annotation from the AI will have a unique color, making it easy to understand the plan.
- After showing its plan, the AI automatically proceeds to generate the final image based on this reasoning.
- This feature gives you a transparent look into the AI's thought process, helping you refine your prompts for better results.
`,
    'changelog.v1_4.title': "V1.4",
    'changelog.v1_4.subtitle': "The Clarity Update: New Tutorial & Smarter Tools",
    'changelog.v1_4.features': `
- Added image referencing! Use "Add Refs" to upload up to 3 context images. The main image is @1, and references are @2, @3, etc. You can reference them in your prompt (e.g., "style from @2"), and they will be highlighted.
- Now you can support the project! A "Donate" button has been added, because every banana helps the crunch.
- Added a Hall of Fame section to recognize those who create and promote the app alongside Acid Crunch.
- The former "New" button is now "Home" at the top of the left toolbar for a quick project reset.
- Added a comprehensive in-app Tutorial! Click the new "Info" button on the right toolbar to learn about all the tools.
- Download your work-in-progress! The download button now saves the image with all your current annotations and layers.
- The "Clear" button is now "Clear Sketches" for better understanding.
- Added Zoom (mouse wheel) and Focus (double-click/button) for easy canvas navigation.
- Reorganized toolbars with improved button grouping for a more logical workflow.
`,
    'changelog.v1_3.title': "V1.3",
    'changelog.v1_3.subtitle': "Magic Prompt & UI Enhancements",
    'changelog.v1_3.features': `
- Introduced Magic Prompt! It enhances your text prompts or automatically creates one from your image if the prompt is empty.
- Improved AI understanding of drawing tools for more accurate edits.
- Added an expandable prompt editor for easily working with long descriptions.
- Added the ability to resize the prompt bar by dragging its top edge.
`,
    'changelog.v1_2.title': "V1.2",
    'changelog.v1_2.subtitle': "More Presets & Filtering",
    'changelog.v1_2.features': `
- Added over 195 new advanced presets for a wide range of editing tasks.
- Implemented filtering by tags to quickly find the right preset.
- General improvements to the preset interface.
`,
    'changelog.v1_1.title': "V1.1",
    'changelog.v1_1.subtitle': "Toolbar Redesign & Presets",
    'changelog.v1_1.features': `
- The main toolbar has been split into two: tools on the left, system actions on the right.
- Enlarged the interface and icons for better usability.
- Added the first version of the Presets feature.
`,
    'changelog.v1_0.title': "V1.0",
    'changelog.v1_0.subtitle': "Initial Release",
    'changelog.v1_0.features': `
- BananaCrunch Draw-To-Edit is live!
- Upload, draw on your image, and use text prompts to edit with AI.
`,
    'info_modal.title': "Master the Canvas: Your Guide to BananaCrunch",
    'info_modal.p1': "Welcome to the creative cockpit! This guide will turn you from a user into a pro, revealing all the secrets of our powerful toolset.",
    
    'info_modal.workspace_title': "The Canvas: Your Playground",
    'info_modal.workspace_desc': "This is the main area where you'll arrange, select, and interact with your images. Each image is automatically assigned a reference number (like @1, @2) for use in prompts.",
    'info_modal.uploading_title': "Uploading Images",
    'info_modal.uploading_desc': "Get images onto the canvas in multiple ways: Drag & Drop them from your desktop, paste from your clipboard (Ctrl+V), use the '+' button on the generation bar, or open your Webcam also from the '+' menu.",
    'info_modal.interacting_title': "Interacting with Images",
    'info_modal.interacting_desc': "Select an image with a click. Add to a selection with Shift+Click, or drag a marquee to select multiple. Drag to move, or use the corner handles to resize.",
    'info_modal.floating_buttons_title': "Floating Action Bar",
    'info_modal.floating_buttons_desc': "When you select a single image, a powerful action bar appears above it, providing one-click access to essential tools:\n- **Edit (Shift+E):** Enter the focused Editor mode.\n- **Aspect Ratio (Shift+A):** Open the Aspect Ratio Editor for cropping and outpainting.\n- **Actions Menu:** A dropdown with one-click generative actions like Enhance V2, RTX v2, Mix, Reference, and Replica.\n- **Regenerate (Ctrl+R):** Reruns the last generation command for this image.\n- **Download (Shift+S) & Delete (Del).**",

    'info_modal.editor_title': "The Editor & Aspect Ratio",
    'info_modal.editor_desc': "Double-click an image or press the 'Edit' button to enter the focused Editor. Here, you add sketches and layers to guide the AI. The Aspect Ratio tool (Shift+A) is where you crop or expand your image. Drag the sides or corners freely, zoom with the mouse wheel, and then choose to crop the image, fill the new area with a color/transparency, or have the AI intelligently outpaint the new areas.",
    'info_modal.confirm_edits_title': "Confirm Edits",
    'info_modal.confirm_edits_desc': "The green checkmark button on the left toolbar saves all your sketches and layers to the image and exits the Editor, returning you to the main canvas.",
    'info_modal.layers_title': "Layers",
    'info_modal.layers_desc': "Use the '+' button on the left toolbar to add new images as layers on top of your main image. You can then move and resize them with the Selection tool. This is great for creating compositions or providing direct visual elements for the AI to use.",
    'info_modal.drawing_tools_title': "Drawing Tools",
    'info_modal.drawing_tools_desc': "Use Brush, Lasso, Arrow, and Text tools to add annotations. These drawings tell the AI where and how to make changes. The color and size can be adjusted on the left toolbar.",

    'info_modal.right_toolbar_title': "The Control Panel",
    'info_modal.right_toolbar_desc': "Your universal toolkit for managing your workflow, available in both Canvas and Editor views.",
    'info_modal.undo_redo_title': "Undo & Redo",
    'info_modal.undo_redo_desc': "Your safety net. It works for everything: moving images, drawing, and even after a generation.",
    'info_modal.selection_hand_title': "Selection & Hand",
    'info_modal.selection_hand_desc': "Switch between selecting/moving objects and panning the canvas. Pro-tip: just hold Spacebar to temporarily activate the Hand tool!",
    'info_modal.focus_title': "Focus",
    'info_modal.focus_desc': "Lost in your canvas? Double-click the background or use this button to reset the view and see everything.",
    'info_modal.clear_title': "Clear",
    'info_modal.clear_desc': "In Canvas mode, this deletes all images. In Editor mode, it only removes the sketches and layers you've added, leaving the original image intact.",
    
    'info_modal.generation_bar_title': "The Generation Bar: Command Center",
    'info_modal.generation_bar_desc': "This is where you communicate with the AI. You can resize it by dragging its edges. Use the prompt area for text commands, or explore advanced features via the adjacent buttons.",
    'info_modal.prompt_area_title': "Prompt Area & Modes",
    'info_modal.prompt_area_desc': "Describe your changes using @-references. Use the '+' button to access Modes (Reasoning, Magic Prompt, Bad Mode), Presets, add local images, or open your Webcam.",
    'info_modal.action_buttons_title': "Ratio, Voice & Generation",
    'info_modal.action_buttons_desc': "Next to the '+' button, set a specific Aspect Ratio for text-to-image generations. The Microphone button activates Voice Control, allowing you to command the editor with your voice. Finally, the Generate button brings your ideas to life.",
    
    'info_modal.protips_title': "Pro-Tips & Creative Combos",
    'info_modal.protip1_title': "The Compositor",
    'info_modal.protip1_desc': "Add a character image as a new layer in the Editor. Return to the canvas, select the main image, and prompt: 'Integrate the character from the top layer into the scene realistically.' The AI will blend them together!",
    'info_modal.protip2_title': "The Debugger",
    'info_modal.protip2_desc': "Generation not what you expected? Use Reasoning Mode. It draws the AI's plan on the image. If the arrows are wrong, your prompt needs clarification. It's like reading the AI's mind!",
    'info_modal.protip3_title': "The Idea Machine",
    'info_modal.protip3_desc': "Creative block? Upload an image, leave the prompt empty, toggle on Magic Prompt, and hit Generate. The AI will invent a creative edit for you.",
    'info_modal.protip4_title': "The Upscaler",
    'info_modal.protip4_desc': "For blurry photos, use Enhance first. This gives the AI a high-quality canvas to work with, resulting in vastly better edits.",
    'info_modal.protip5_title': "The Teleporter",
    'info_modal.protip5_desc': "Use reference images (@2, @3) for more than just style. Upload a background as @2 and prompt: 'Place the person from @1 into the environment of @2.'",
    'info_modal.protip6_title': "The Speedrunner",
    'info_modal.protip6_desc': "Master hotkeys! They are your fastest path to creation. See the dedicated Hotkeys section below to learn them all.",
    'info_modal.final_tip_title': "The Final Pro-Tip",
    'info_modal.final_tip_desc': "Creativity is key! Combine these tools in unexpected ways. Use Reasoning on a Magic Prompt result. Use Reference on an image you just created with Replica. Experiment, break the rules, and see what you can create!",
    
    'info_modal.hotkeys_title': "Hotkeys & Shortcuts",
    'info_modal.hotkeys_desc': "Speed up your workflow by mastering these keyboard shortcuts.",
    'info_modal.hotkeys_generation_title': "Generation",
    'info_modal.hotkey_generate': "Generate",
    'info_modal.hotkey_regenerate': 'Regenerate Image',
    'info_modal.hotkey_reasoning': "Toggle Reasoning Mode",
    'info_modal.hotkey_enhance': "Enhance",
    'info_modal.hotkey_edit_image': "Edit Image",
    'info_modal.hotkey_magic_prompt': "Toggle Magic Prompt",
    'info_modal.hotkey_bad_mode': "Toggle Bad Mode",
    'info_modal.hotkeys_tools_title': "Tools",
    'info_modal.hotkey_tool_selection': "Selection Tool",
    'info_modal.hotkey_tool_hand': "Hand Tool",
    'info_modal.hotkey_tool_lasso': "Lasso Tool",
    'info_modal.hotkey_tool_arrow': "Arrow Tool",
    'info_modal.hotkey_tool_text': "Text Tool",
    'info_modal.hotkeys_canvas_title': "Canvas Control",
    'info_modal.hotkey_undo': "Undo",
    'info_modal.hotkey_redo': "Redo",
    'info_modal.hotkey_delete': "Delete Selected",
    'info_modal.hotkey_add_image': "Add Image",
    'info_modal.hotkey_camera': "Open Camera",
    'info_modal.hotkey_presets': "Open Presets",
    'info_modal.hotkey_expand_prompt': "Expand Prompt Editor",
    'info_modal.hotkey_aspect_ratio': "Aspect Ratio Editor",
    'info_modal.hotkey_proportional_resize': "Proportional Resize",
    'info_modal.hotkey_download': "Download Image",
    'info_modal.hotkey_temp_hand': "Temporary Hand Tool",
    'info_modal.hotkey_cancel_aspect': "Cancel Aspect Ratio Edit",
    
    'drop_zone.title': "Drop images anywhere",
    'donate.button': 'Donate',
    'donate_modal.title': 'Support the Project',
    'donate_modal.description': 'Your contribution helps keep the bananas crunching and the AI improving. Thank you for your support!',
    'donate_modal.tab_sber': 'Sber',
    'donate_modal.tab_yandex': 'Yandex Pay',
    'donate_modal.yandex_pay_button': 'Y.Pay',
    'hall_of_fame.button': 'Hall of Fame',
    'hall_of_fame.title': 'Hall of Fame',
    'hall_of_fame.creator': 'Creator',
    'hall_of_fame.second_pilot': 'Second Pilot',
    'hall_of_fame.upgraders': 'Upgraders',
    'hall_of_fame.boosters': 'Boosters',
    'hall_of_fame.creator_desc': 'The original author and mad scientist behind BananaCrunch.',
    'hall_of_fame.islam_desc': 'Contributed over 200 professional presets and has been instrumental in refining and testing new features.',
    'hall_of_fame.max_kim_desc': 'The first to showcase the application to a wide audience, kickstarting its journey.',
    'hall_of_fame.belyak_desc': 'Provided a detailed review and valuable feedback that helped improve the user experience.',
    'hall_of_fame.memes_desc': 'Among the first to support and spread the word about the project.',
    'hall_of_fame.golden_boys': 'Golden Boys',
    'hall_of_fame.nazar_desc': 'Supported the project with 1000 ₽.',
    'hall_of_fame.mikheys_desc': "Contributed to the project: prompt clearing, prompt history in the Log button, and the MIX function. Also: massively upgraded the Aspect Ratio Editor (transparency, crop, zoom, flexible sides), added voice control, corner customization, and the mobile version.",
    'hall_of_fame.filatov_desc': "Helped deploy the Application to a website, which allowed expanding beyond the tight confines of AI Studio and also increased the application's performance.",
    'api_key_modal.title': 'API Key',
    'api_key_modal.description': 'You can use your own Google Gemini API key. Your key is saved locally in your browser and is not sent anywhere else.',
    'api_key_modal.placeholder': 'Enter your API key',
    'api_key_modal.save_button': 'Save',
    'api_key_modal.use_studio_key_button': 'Use Studio Key',
    'api_key_modal.current_key': 'Current key source:',
    'api_key_modal.user_key_display': 'Your Key',
    'api_key_modal.studio_key_display': 'Studio Key',
    'voice_consent_modal.title': 'Voice Control Activation',
    'voice_consent_modal.p1': 'To use voice commands, this application needs access to your microphone.',
    'voice_consent_modal.p2': 'Your browser will ask for permission. Audio is processed in real-time for voice commands and is not stored.',
    'voice_consent_modal.cancel_button': 'Cancel',
    'voice_consent_modal.agree_button': 'Agree & Continue',
    'camera_consent_modal.title': 'Camera Access',
    'camera_consent_modal.p1': 'To take a picture, this application needs access to your camera.',
    'camera_consent_modal.p2': 'Your browser will ask for permission. The image is only used when you take a picture and is not stored or sent anywhere without your action.',
    'camera_consent_modal.cancel_button': 'Cancel',
    'camera_consent_modal.agree_button': 'Agree & Continue'

  },
  ru: {
    'app.description': 'Легко меняйте одежду, редактируйте детали или изменяйте стиль изображений. Просто нарисуйте маску и добавьте свой штрих.',
    'app.telegram_link_text': 'Присоединяйтесь к Telegram-каналу',
    'app.bot_link_text': 'Используйте бота Banana Crunch для промптов',
    'log.title': 'Журнал действий',
    'log.empty': 'Записей пока нет. Начните генерацию, чтобы увидеть журнал.',
    'log.action.start_generation': 'Начинаю процесс генерации...',
    'log.action.start_enhance': 'Начинаю процесс улучшения...',
    'log.action.start_rtx': 'Начинаю RTX-генерацию...',
    'log.action.start_mix': 'Начинаю процесс смешивания слоев...',
    'log.action.start_ref': 'Начинаю REF-генерацию...',
    'log.action.start_rep': 'Начинаю REP-генерацию...',
    'log.magic_prompt_active': '"Волшебный промпт" активирован. Улучшаю промпт...',
    'log.magic_prompt_success': 'Промпт успешно улучшен.',
    'log.magic_prompt_fail': 'Не удалось улучшить промпт, используется исходный.',
    'log.magic_prompt_fail_json': 'Не удалось разобрать улучшенный промпт от модели, используется исходный.',
    'log.magic_prompt_error': 'Ошибка при улучшении промпта: {message}',
    'error.no_annotations_or_prompt': 'Пожалуйста, добавьте аннотации или напишите инструкцию для генерации изображения.',
    'error.blocked_by_safety': 'Ваш запрос был заблокирован по соображениям безопасности (Причина: {reason}). Пожалуйста, измените свой промпт или аннотации.',
    'error.model_no_response': 'Модель не дала ответа. Это может быть связано с перегрузкой сервера или внутренней ошибкой. Пожалуйста, попробуйте еще раз.',
    'error.content_blocked_by_safety': 'Сгенерированный контент был заблокирован по соображениям безопасности. Пожалуйста, измените свой промпт, чтобы он соответствовал политикам безопасности.',
    'error.model_no_image': 'Модель не вернула изображение в своем ответе. Попробуйте изменить свои аннотации или промпт, чтобы они были более четкими.',
    'error.image_load_fail': 'Не удалось загрузить сгенерированное изображение. Данные от API могут быть повреждены.',
    'error.unknown': 'Произошла неизвестная ошибка.',
    'error.api_error_prefix': 'Ошибка API:',
    'error.no_image_to_download': 'Не выбрано изображение для скачивания.',
    'error.ref_image_fail': 'Не удалось обработать референсные изображения.',
    'error.no_image_to_enhance': 'Пожалуйста, выберите изображение для улучшения.',
    'error.no_image_to_mix': 'Пожалуйста, выберите одно изображение для смешивания.',
    'error.magic_prompt_generate_fail': 'Волшебный промпт не смог сгенерировать идею. Пожалуйста, попробуйте снова или введите промпт.',
    'error.mic_blocked': "Доступ к микрофону заблокирован. Пожалуйста, включите его в настройках вашего браузера, чтобы использовать голосовое управление.",
    'error.cam_blocked': 'Доступ к камере заблокирован. Пожалуйста, включите его в настройках вашего браузера.',
    'button.back': 'Назад',
    'loading.thinking': 'ИИ думает...',
    'loading.enhancing': 'Улучшение изображения...',
    'loading.creating_annotations': 'Создание аннотаций...',
    'loading.improving_prompt': 'Улучшение промпта...',
    'loading.generating_image': 'Генерация изображения...',
    'loading.generating_mixed_scene': 'Генерация смешанной сцены...',
    'loading.rtx': 'Применение RTX...',
    'uploader.drag_and_drop': 'Перетащите изображение сюда',
    'uploader.or': 'или',
    'uploader.upload_file': 'Загрузить файл',
    'toolbar.left.home': 'Домой',
    'toolbar.left.add_layer': 'Добавить слой',
    'toolbar.left.brush': 'Кисть',
    'toolbar.left.lasso': 'Лассо',
    'toolbar.left.arrow': 'Стрелка',
    'toolbar.left.text': 'Текст',
    'toolbar.left.enhance': 'Прорисовка деталей',
    'toolbar.rtx': 'Улучшить 3D графику',
    'toolbar.mix': 'Mix (соедини коллаж в сцену)',
    'toolbar.ref': 'Reference - Создаёт что либо из этого стиля',
    'toolbar.rep': 'Replica - Создаёт новую версию этого изображения',
    'toolbar.edit_image': 'Редактировать',
    'toolbar.left.color_picker_title': 'Выбрать цвет',
    'toolbar.right.undo': 'Отменить',
    'toolbar.right.redo': 'Повторить',
    'toolbar.right.clear_sketches': 'Очистить наброски',
    'toolbar.right.selection': 'Выделение и перемещение',
    'toolbar.right.hand': 'Рука',
    'toolbar.right.focus': 'Фокус',
    'toolbar.right.log': 'Лог',
    'toolbar.right.info': 'Инфо',
    'toolbar.right.delete_image': 'Удалить изображение',
    'toolbar.right.ui_lang_title': 'Язык интерфейса',
    'toolbar.actions': 'Действия',
    'toolbar.actions_tooltip': 'Универсальные инструкции',
    'generate_bar.placeholder': 'Опишите желаемые изменения...',
    'generate_bar.add_image': 'Добавить IMG',
    'generate_bar.camera': 'Камера',
    'generate_bar.download': 'Скачать',
    'generate_bar.presets_beta': 'Пресеты',
    'generate_bar.magic_prompt': 'Магия',
    'generate_bar.magic_mode_active': 'Магия',
    'generate_bar.bad_mode': 'Бэд Мод',
    'generate_bar.bad_mode_active': 'Bad',
    'generate_bar.reasoning': 'Думать',
    'generate_bar.reasoning_mode': 'Режим "Думать"',
    'generate_bar.reasoning_mode_active': 'Думать',
    'generate_bar.expand_prompt': 'Развернуть редактор промпта',
    'generate_bar.clear_prompt': 'Очистить промпт',
    'generate_bar.button_generating': 'Генерация...',
    'generate_bar.button_reasoning_loading': 'Рассуждение...',
    'generate_bar.button_generate': 'Генерировать',
    'generate_bar.button_generate_outpainting': 'Подтвердить и сгенерировать',
    'presets.title': 'Пресеты промптов',
    'presets.search_placeholder': 'Поиск по пресетам...',
    'presets.tags.all': 'Все',
    'presets.tags.character': 'Персонаж',
    'presets.tags.environment': 'Окружение',
    'presets.tags.style': 'Стилизация',
    'presets.tags.retouch': 'Ретушь',
    'presets.tags.composition': 'Композиция',
    'presets.tags.design': 'Дизайн',
    'presets.tags.d3': '3D',
    'text_editor.placeholder': 'Текст...',
    'text_editor.cancel_title': 'Отмена',
    'text_editor.align_left_title': 'Выровнять по левому краю',
    'text_editor.align_center_title': 'Выровнять по центру',
    'text_editor.align_right_title': 'Выровнять по правому краю',
    'text_editor.confirm_title': 'Подтвердить',
    'text_editor.color_picker_title': 'Выбрать цвет',
    'editor.confirm_edits': 'Применить',
    'prompt_modal.title': 'Редактор промпта',
    'prompt_modal.save': 'Сохранить',
    'prompt_modal.cancel': 'Отмена',
    'workspace.aspect_ratio_edit': 'Редактор соотношения сторон',
    'workspace.change_bg_color': 'Изменить цвет фона',
    'workspace.regenerate': 'Перегенерировать',
    'workspace.crop': 'Обрезать',
    'changelog.title': 'Что нового',
    'changelog.v2_2.title': 'V2.2',
    'changelog.v2_2.subtitle': 'Новые Экшены, Голосовое Управление и UX Апгрейды',
    'changelog.v2_2.features': `
- **Меню Действий:** Новый, полностью обновлённый функционал быстрых действий с изображением. Так как экшенов стало много, они теперь находятся в выпадающем списке.
- **Enhance V2:** Улучшена инструкция, теперь будет чаще срабатывать и лучше прорисовывать детали.
- **RTX v2:** Также улучшена инструкция, почти как Enhance, только больше заточена под 3D-графику и добавляет освещение и отражения.
- **Reference (Новый экшен):** Позволяет генерировать объекты, живых существ и сцены из представленного мира с той же стилистикой. Можно дополнительно указать в промпте, что вы хотите сделать, например, "кошку".
- **Replica (Новый экшен):** Создаёт изображение, описав выделенное изображение промптом. По сути, переизобретает существующее изображение.
- **Редактор Соотношения Сторон:** @muxastarikov хорошенько прокачал этот режим. Теперь можно выбрать, чтобы область была прозрачной, появился функционал обрезки, также можно приближаться и отдаляться колёсиком. Также можно тянуть за стороны для самых гибких соотношений сторон.
- **Prompt Builder:** Все дополнительные функции теперь в '+' как в ChatGPT. Появился 'Ratio' на вывод генерации в определённом соотношении сторон.
- **Голосовое Управление:** @muxastarikov добавил голосовое создание и редактирование изображений. Будьте осторожны, это быстро расходует квоту.
- **Reasoning Режим:** 'Reasoning' стал режимом. Если надо, включаете через горячую клавишу 'R' и генерируете на постоянке с авто-стрелками картинки.
- **Bad Mode (Экспериментальный):** Добавился новый экспериментальный 'Bad mode', смягчающий цензуру. Очень нестабильный и пока работает плохо.
- **Съёмка с веб-камеры:** Добавилась возможность фотографировать с веб-камеры.
- **Header:** Теперь Header имеет стеклянную подложку. Появилось меню, куда будут сваливаться всякие информационные и косметические настройки.
- **Кастомизация Углов:** @muxastarikov добавил кастомизацию скругления углов для любителей остренького.
- **Мобильная версия:** @muxastarikov сделал мобильную версию. Теперь приложением можно пользоваться и с мобильника, и даже, возможно, с тачпада.
`,
    'changelog.v2_0.title': 'V2.0',
    'changelog.v2_0.subtitle': 'Грандиозный редизайн и обновление Pro-Tips',
    'changelog.v2_0.features': `
- Полный редизайн интерфейса: Всё приложение переработано с современным, элегантным интерфейсом для более интуитивного творческого процесса.
- Расширенная библиотека пресетов: Значительно расширены пресеты сотнями новых, узкоспециализированных промптов для профессиональных задач.
- Полная поддержка слоёв: Редактор теперь поддерживает добавление, перемещение и изменение размера слоев изображений для точного контроля над композицией.
- Drag & Drop / Вставка: Добавляйте изображения прямо на холст, перетаскивая их с рабочего стола или вставляя с помощью Ctrl+V.
- Новые инструменты 'Enhance' и 'RTX': Мгновенно улучшайте качество, детализацию и освещение изображения одним кликом на плавающей панели инструментов.
- Редактор соотношения сторон: Недеструктивно изменяйте соотношение сторон изображения и позволяйте ИИ интеллектуально заполнять (дорисовывать) новые области.
- Подсказки везде: Наведите курсор на любую кнопку, чтобы увидеть полезную подсказку с её функцией и горячей клавишей.
- Новая база знаний 'Инфо': Модальное окно 'Инфо' полностью переписано и теперь является исчерпывающим руководством по каждому инструменту, функции, про-совету и горячей клавише.
- Редизайн хедера: Основной хедер был реорганизован для лучшей эргономики.
- Плавающие кнопки действий: Удобный набор кнопок действий теперь появляется над любым выбранным изображением.
- Интерактивный список изменений: Раздел "Что нового" теперь представляет собой интерактивный аккордеон.
`,
    'changelog.v1_5_1.title': 'V1.5.1',
    'changelog.v1_5_1.subtitle': 'The Enhance Update & Smarter AI',
    'changelog.v1_5_1.features': `
- Новая функция "Улучшить"! Нажмите на иконку пикселей на левой панели инструментов, чтобы сделать изображение более детализированным. Идеально подходит для улучшения исходных изображений низкого качества.
- ИИ теперь лучше понимает слои.
- Внутренние инструкции для "Магии" были доработаны, что привело к более точным и релевантным улучшениям промптов.
`,
    'changelog.v1_5.title': "V1.5",
    'changelog.v1_5.subtitle': "The \"Reasoning\" Update: Увидьте план ИИ!",
    'changelog.v1_5.features': `
- Представляем кнопку "Рассуждение"! Нажмите на нее, и ИИ проанализирует ваш промпт и нарисует свой план прямо на изображении с помощью стрелок и текстовых аннотаций.
- Каждая аннотация от ИИ будет иметь уникальный цвет, что облегчает понимание плана.
- После демонстрации своего плана ИИ автоматически приступает к генерации финального изображения на основе этого рассуждения.
- Эта функция дает вам прозрачный взгляд на мыслительный процесс ИИ, помогая вам уточнять свои промпты для получения лучших результатов.
`,
    'changelog.v1_4.title': "V1.4",
    'changelog.v1_4.subtitle': "The Clarity Update: Новый туториал и умные инструменты",
    'changelog.v1_4.features': `
- Добавлена возможность ссылаться на изображения! Используйте "Добавить референсы", чтобы загрузить до 3 контекстных изображений. Основное изображение — @1, а референсы — @2, @3 и т.д. Вы можете ссылаться на них в своем промпте (например, "стиль из @2"), и они будут подсвечиваться.
- Теперь вы можете поддержать проект! Добавлена кнопка "Донат", потому что каждый банан помогает хрусту.
- Добавлен Зал славы, чтобы отметить тех, кто создает и продвигает приложение вместе с Acid Crunch.
- Бывшая кнопка "Новый" теперь "Домой" вверху левой панели инструментов для быстрого сброса проекта.
- Добавлен исчерпывающий внутриигровой туториал! Нажмите новую кнопку "Инфо" на правой панели инструментов, чтобы узнать обо всех инструментах.
- Скачивайте свою работу в процессе! Кнопка скачивания теперь сохраняет изображение со всеми вашими текущими аннотациями и слоями.
- Кнопка "Очистить" теперь "Очистить наброски" для лучшего понимания.
- Добавлены масштабирование (колесико мыши) и фокусировка (двойной клик/кнопка) для удобной навигации по холсту.
- Реорганизованы панели инструментов с улучшенной группировкой кнопок для более логичного рабочего процесса.
`,
    'changelog.v1_3.title': "V1.3",
    'changelog.v1_3.subtitle': "Волшебный промпт и улучшения интерфейса",
    'changelog.v1_3.features': `
- Представлен Волшебный промпт! Он улучшает ваши текстовые промпты или автоматически создает их из вашего изображения, если промпт пуст.
- Улучшено понимание ИИ инструментов рисования для более точных правок.
- Добавлен расширяемый редактор промптов для удобной работы с длинными описаниями.
- Добавлена возможность изменять размер панели промптов путем перетаскивания ее верхнего края.
`,
    'changelog.v1_2.title': "V1.2",
    'changelog.v1_2.subtitle': "Больше пресетов и фильтрация",
    'changelog.v1_2.features': `
- Добавлено более 195 новых расширенных пресетов для широкого спектра задач редактирования.
- Реализована фильтрация по тегам для быстрого поиска нужного пресета.
- Общие улучшения интерфейса пресетов.
`,
    'changelog.v1_1.title': "V1.1",
    'changelog.v1_1.subtitle': "Редизайн панели инструментов и пресеты",
    'changelog.v1_1.features': `
- Основная панель инструментов разделена на две: инструменты слева, системные действия справа.
- Увеличен интерфейс и иконки для лучшего удобства использования.
- Добавлена первая версия функции пресетов.
`,
    'changelog.v1_0.title': "V1.0",
    'changelog.v1_0.subtitle': "Первый релиз",
    'changelog.v1_0.features': `
- BananaCrunch Draw-To-Edit запущен!
- Загружайте, рисуйте на своем изображении и используйте текстовые промпты для редактирования с помощью ИИ.
`,
    'info_modal.title': "Освойте холст: ваш гид по BananaCrunch",
    'info_modal.p1': "Добро пожаловать в творческую кабину! Этот гид превратит вас из пользователя в профессионала, раскрыв все секреты нашего мощного набора инструментов.",
    
    'info_modal.workspace_title': "Холст: ваша игровая площадка",
    'info_modal.workspace_desc': "Это основная область, где вы будете располагать, выбирать и взаимодействовать с вашими изображениями. Каждому изображению автоматически присваивается ссылочный номер (например, @1, @2) для использования в промптах.",
    'info_modal.uploading_title': "Загрузка изображений",
    'info_modal.uploading_desc': "Получите изображения на холст несколькими способами: перетащите их с рабочего стола, вставьте из буфера обмена (Ctrl+V), используйте кнопку '+' на панели генерации или откройте веб-камеру из того же меню '+'.",
    'info_modal.interacting_title': "Взаимодействие с изображениями",
    'info_modal.interacting_desc': "Выберите изображение кликом. Добавьте к выделению с помощью Shift+Click или перетащите рамку для выбора нескольких. Перетаскивайте для перемещения или используйте угловые маркеры для изменения размера.",
    'info_modal.floating_buttons_title': "Плавающая панель действий",
    'info_modal.floating_buttons_desc': "Когда вы выбираете одно изображение, над ним появляется мощная панель действий, предоставляющая доступ к основным инструментам в один клик:\n- **Редактировать (Shift+E):** Войти в режим сфокусированного редактирования.\n- **Соотношение сторон (Shift+A):** Открыть редактор для обрезки и дорисовки.\n- **Меню действий:** Выпадающий список с мощными генеративными действиями: Enhance V2, RTX v2, Mix, Reference и Replica.\n- **Перегенерировать (Ctrl+R):** Повторить последнюю команду генерации для этого изображения.\n- **Скачать (Shift+S) и Удалить (Del).**",

    'info_modal.editor_title': "Редактор и Соотношение сторон",
    'info_modal.editor_desc': "Дважды щелкните изображение или нажмите 'Редактировать', чтобы войти в редактор. Здесь вы добавляете наброски и слои, которые направляют ИИ. Инструмент 'Соотношение сторон' (Shift+A) — это место, где вы обрезаете или расширяете изображение. Свободно перетаскивайте стороны или углы, масштабируйте колесиком мыши, а затем выбирайте: обрезать изображение, заполнить новую область цветом/прозрачностью или позволить ИИ интеллектуально дорисовать новые области.",
    'info_modal.confirm_edits_title': "Применить изменения",
    'info_modal.confirm_edits_desc': "Зеленая кнопка с галочкой на левой панели инструментов сохраняет все ваши наброски и слои на изображение и выходит из Редактора, возвращая вас на основной холст.",
    'info_modal.layers_title': "Слои",
    'info_modal.layers_desc': "Используйте кнопку '+' на левой панели инструментов, чтобы добавить новые изображения в качестве слоев поверх основного. Затем вы можете перемещать и изменять их размер с помощью инструмента 'Выделение'. Это отлично подходит для создания композиций или предоставления прямых визуальных элементов для ИИ.",
    'info_modal.drawing_tools_title': "Инструменты рисования",
    'info_modal.drawing_tools_desc': "Используйте инструменты 'Кисть', 'Лассо', 'Стрелка' и 'Текст' для добавления аннотаций. Эти рисунки сообщают ИИ, где и как вносить изменения. Цвет и размер можно настроить на левой панели инструментов.",

    'info_modal.right_toolbar_title': "Панель управления",
    'info_modal.right_toolbar_desc': "Ваш универсальный набор инструментов для управления рабочим процессом, доступный как в режиме холста, так и в режиме редактора.",
    'info_modal.undo_redo_title': "Отменить и повторить",
    'info_modal.undo_redo_desc': "Ваша страховка. Работает для всего: перемещение изображений, рисование и даже после генерации.",
    'info_modal.selection_hand_title': "Выделение и рука",
    'info_modal.selection_hand_desc': "Переключайтесь между выбором/перемещением объектов и панорамированием холста. Про-совет: просто удерживайте пробел, чтобы временно активировать инструмент 'Рука'!",
    'info_modal.focus_title': "Фокус",
    'info_modal.focus_desc': "Потерялись на холсте? Дважды щелкните по фону или используйте эту кнопку, чтобы сбросить вид и увидеть все.",
    'info_modal.clear_title': "Очистить",
    'info_modal.clear_desc': "В режиме холста это удаляет все изображения. В режиме редактора это удаляет только добавленные вами наброски и слои, оставляя исходное изображение нетронутым.",
    
    'info_modal.generation_bar_title': "Панель генерации: Командный центр",
    'info_modal.generation_bar_desc': "Здесь вы общаетесь с ИИ. Вы можете изменять ее размер, перетаскивая края. Используйте область промпта для текстовых команд или изучайте расширенные функции с помощью соседних кнопок.",
    'info_modal.prompt_area_title': "Область промпта и режимы",
    'info_modal.prompt_area_desc': "Опишите ваши изменения, используя @-ссылки. Используйте кнопку '+' для доступа к Режимам ('Думать', 'Магия', 'Бэд Мод'), Пресетам, добавления локальных изображений или открытия вашей веб-камеры.",
    'info_modal.action_buttons_title': "Ratio, Голос и Генерация",
    'info_modal.action_buttons_desc': "Рядом с кнопкой '+' вы можете установить конкретное Соотношение сторон для генерации из текста. Кнопка с микрофоном активирует Голосовое управление, позволяя вам управлять редактором голосом. Наконец, кнопка 'Генерировать' воплощает ваши идеи в жизнь.",
    
    'info_modal.protips_title': "Про-советы и креативные комбинации",
    'info_modal.protip1_title': "Компоновщик",
    'info_modal.protip1_desc': "Добавьте изображение персонажа как новый слой в редакторе. Вернитесь на холст, выберите основное изображение и напишите промпт: 'Интегрируй персонажа с верхнего слоя в сцену реалистично'. ИИ смешает их вместе!",
    'info_modal.protip2_title': "Отладчик",
    'info_modal.protip2_desc': "Генерация не такая, как вы ожидали? Используйте режим 'Думать'. Он рисует план ИИ на изображении. Если стрелки неправильные, ваш промпт нуждается в уточнении. Это как читать мысли ИИ!",
    'info_modal.protip3_title': "Машина идей",
    'info_modal.protip3_desc': "Творческий ступор? Загрузите изображение, оставьте промпт пустым, включите 'Магию' и нажмите 'Генерировать'. ИИ придумает для вас креативное изменение.",
    'info_modal.protip4_title': "Улучшатель",
    'info_modal.protip4_desc': "Для размытых фотографий сначала используйте 'Enhance'. Это дает ИИ высококачественный холст для работы, что приводит к значительно лучшим правкам.",
    'info_modal.protip5_title': "Телепортер",
    'info_modal.protip5_desc': "Используйте референсные изображения (@2, @3) не только для стиля. Загрузите фон как @2 и напишите промпт: 'Помести человека из @1 в окружение из @2'.",
    'info_modal.protip6_title': "Спидраннер",
    'info_modal.protip6_desc': "Освойте горячие клавиши! Это ваш самый быстрый путь к творчеству. Смотрите специальный раздел 'Горячие клавиши' ниже, чтобы выучить их все.",
    'info_modal.final_tip_title': "Последний про-совет",
    'info_modal.final_tip_desc': "Креативность — это ключ! Комбинируйте эти инструменты неожиданными способами. Используйте 'Думать' на результате 'Магии'. Используйте 'Reference' на изображении, которое вы только что создали с помощью 'Replica'. Экспериментируйте, нарушайте правила и смотрите, что у вас получится создать!",
    
    'info_modal.hotkeys_title': "Горячие клавиши и шорткаты",
    'info_modal.hotkeys_desc': "Ускорьте свой рабочий процесс, освоив эти сочетания клавиш.",
    'info_modal.hotkeys_generation_title': "Генерация",
    'info_modal.hotkey_generate': "Генерировать",
    'info_modal.hotkey_regenerate': 'Перегенерировать изображение',
    'info_modal.hotkey_reasoning': "Переключить режим 'Думать'",
    'info_modal.hotkey_enhance': "Улучшить",
    'info_modal.hotkey_edit_image': "Редактировать изображение",
    'info_modal.hotkey_magic_prompt': "Переключить Волшебный промпт",
    'info_modal.hotkey_bad_mode': 'Переключить Бэд Мод',
    'info_modal.hotkeys_tools_title': "Инструменты",
    'info_modal.hotkey_tool_selection': "Инструмент выделения",
    'info_modal.hotkey_tool_hand': "Инструмент 'Рука'",
    'info_modal.hotkey_tool_lasso': "Инструмент 'Лассо'",
    'info_modal.hotkey_tool_arrow': "Инструмент 'Стрелка'",
    'info_modal.hotkey_tool_text': "Инструмент 'Текст'",
    'info_modal.hotkeys_canvas_title': "Управление холстом",
    'info_modal.hotkey_undo': "Отменить",
    'info_modal.hotkey_redo': "Повторить",
    'info_modal.hotkey_delete': "Удалить выделенное",
    'info_modal.hotkey_add_image': "Добавить изображение",
    'info_modal.hotkey_camera': "Открыть камеру",
    'info_modal.hotkey_presets': "Открыть пресеты",
    'info_modal.hotkey_expand_prompt': "Развернуть редактор промпта",
    'info_modal.hotkey_aspect_ratio': "Редактор соотношения сторон",
    'info_modal.hotkey_proportional_resize': "Пропорциональное изменение",
    'info_modal.hotkey_download': "Скачать изображение",
    'info_modal.hotkey_temp_hand': "Временный инструмент 'Рука'",
    'info_modal.hotkey_cancel_aspect': "Отменить ред. соотношения сторон",
    
    'drop_zone.title': "Перетащите изображения в любое место",
    'donate.button': 'Донат',
    'donate_modal.title': 'Поддержать проект',
    'donate_modal.description': 'Ваш вклад помогает бананам хрустеть, а ИИ — совершенствоваться. Спасибо за вашу поддержку!',
    'donate_modal.tab_sber': 'Сбер',
    'donate_modal.tab_yandex': 'Яндекс Pay',
    'donate_modal.yandex_pay_button': 'Я.Pay',
    'hall_of_fame.button': 'Зал славы',
    'hall_of_fame.title': 'Зал славы',
    'hall_of_fame.creator': 'Создатель',
    'hall_of_fame.second_pilot': 'Второй пилот',
    'hall_of_fame.upgraders': 'Улучшатели',
    'hall_of_fame.boosters': 'Бустеры',
    'hall_of_fame.creator_desc': 'Автор и безумный ученый, стоящий за BananaCrunch.',
    'hall_of_fame.islam_desc': 'Внес более 200 профессиональных пресетов и сыграл ключевую роль в доработке и тестировании новых функций.',
    'hall_of_fame.max_kim_desc': 'Первым продемонстрировал приложение широкой аудитории, дав старт его пути.',
    'hall_of_fame.belyak_desc': 'Предоставил подробный обзор и ценные отзывы, которые помогли улучшить пользовательский опыт.',
    'hall_of_fame.memes_desc': 'Один из первых, кто поддержал и распространил информацию о проекте.',
    'hall_of_fame.golden_boys': 'Спонсоры',
    'hall_of_fame.nazar_desc': 'поддержал проект на 1000 ₽',
    'hall_of_fame.mikheys_desc': 'Привнёс в проект: удаление промпта, историю промптов в кнопке Log и функцию MIX. А так же: капитально прокачал Редактор Соотношения Сторон (прозрачность, обрезка, зум, гибкие стороны), добавил голосовое управление, кастомизацию углов и мобильную версию.',
    'hall_of_fame.filatov_desc': 'Помог задеплоить Приложение на сайт что позволило раздвинуть тесные рамки Ai studio, а так же увеличило производительность приложения.',
    'api_key_modal.title': 'API Ключ',
    'api_key_modal.description': 'Вы можете использовать свой собственный API-ключ Google Gemini. Ваш ключ сохраняется локально в вашем браузере и больше никуда не отправляется.',
    'api_key_modal.placeholder': 'Введите ваш API-ключ',
    'api_key_modal.save_button': 'Сохранить',
    'api_key_modal.use_studio_key_button': 'Использовать ключ студии',
    'api_key_modal.current_key': 'Текущий источник ключа:',
    'api_key_modal.user_key_display': 'Ваш ключ',
    'api_key_modal.studio_key_display': 'Ключ студии',
    'voice_consent_modal.title': 'Активация голосового управления',
    'voice_consent_modal.p1': 'Для использования голосовых команд этому приложению требуется доступ к вашему микрофону.',
    'voice_consent_modal.p2': 'Ваш браузер запросит разрешение. Аудио обрабатывается в реальном времени для выполнения команд и не сохраняется.',
    'voice_consent_modal.cancel_button': 'Отмена',
    'voice_consent_modal.agree_button': 'Согласиться и продолжить',
    'camera_consent_modal.title': 'Доступ к камере',
    'camera_consent_modal.p1': 'Чтобы сделать снимок, этому приложению требуется доступ к вашей камере.',
    'camera_consent_modal.p2': 'Ваш браузер запросит разрешение. Изображение используется только когда вы делаете снимок и нигде не сохраняется и не отправляется без вашего действия.',
    'camera_consent_modal.cancel_button': 'Отмена',
    'camera_consent_modal.agree_button': 'Согласиться и продолжить'
  }
};

export function useTranslations(lang: Language) {
  return function t(key: string, params?: { [key: string]: string | number }): string {
    let translation = translations[lang][key] || translations['en'][key];
    if (params) {
      Object.keys(params).forEach(pKey => {
        translation = translation.replace(`{${pKey}}`, String(params[pKey]));
      });
    }
    return translation;
  };
}