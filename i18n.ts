
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
    'log.magic_prompt_active': '"Magic Prompt" activated. Improving the prompt...',
    'log.magic_prompt_success': 'Prompt successfully enhanced.',
    'log.magic_prompt_fail': 'Failed to enhance prompt, using original.',
    'log.magic_prompt_fail_json': 'Failed to parse enhanced prompt from model, using original.',
    'log.magic_prompt_error': 'Error enhancing prompt: {message}',
    'error.api_key_not_set': 'API key is not set. Please set the key.',
    'error.no_annotations_or_prompt': 'Please add annotations or write an instruction to generate an image.',
    'error.blocked_by_safety': 'Your request was blocked for safety reasons (Reason: {reason}). Please change your prompt or annotations.',
    'error.model_no_response': 'The model did not provide a response. This could be due to server overload or an internal error. Please try again.',
    'error.content_blocked_by_safety': 'The generated content was blocked for safety reasons. Please change your prompt to comply with safety policies.',
    'error.model_no_image': 'The model did not return an image in its response. Try changing your annotations or prompt to be clearer.',
    'error.unknown': 'An unknown error occurred.',
    'error.api_key_invalid': 'Your API key is not valid. Please check it and try again.',
    'error.quota_exceeded_studio': 'The API usage quota has been exceeded. Please try again later.',
    'error.quota_exceeded_user': 'The API usage quota has been exceeded. Please try again later.',
    'error.api_error_prefix': 'API Error:',
    'error.no_image_to_download': 'No image selected for download.',
    'error.ref_image_fail': 'Failed to process reference images.',
    'error.no_image_to_enhance': 'Please select an image to enhance.',
    'error.no_image_to_mix': 'Please select one image to mix.',
    'error.magic_prompt_generate_fail': 'Magic Prompt failed to generate an idea. Please try again or enter a prompt.',
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
    'uploader.change_api_key': 'Change API Key',
    'toolbar.left.home': 'Home',
    'toolbar.left.add_layer': 'Add Layer',
    'toolbar.left.brush': 'Brush',
    'toolbar.left.lasso': 'Lasso',
    'toolbar.left.arrow': 'Arrow',
    'toolbar.left.text': 'Text',
    'toolbar.left.enhance': 'Render details',
    'toolbar.rtx': 'Improve 3D graphics',
    'toolbar.mix': 'Mix (combine collage into a scene)',
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
    'toolbar.right.change_api_key_title': 'Change API Key',
    'toolbar.right.api_key_label': 'API',
    'toolbar.right.studio_key_label': '(Studio)',
    'toolbar.right.ui_lang_title': 'Interface Language',
    'generate_bar.placeholder': 'Describe the desired changes...',
    'generate_bar.add_image': 'Add Image',
    'generate_bar.download': 'Download',
    'generate_bar.presets_beta': 'Presets',
    'generate_bar.magic_prompt': 'Magic Prompt',
    'generate_bar.reasoning': 'Reasoning',
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
    'api_key_status.studio': 'Studio',
    'api_key_status.user': 'User',
    'api_key_modal.title': 'Manage API Key',
    'api_key_modal.current_key': 'Current active key:',
    'api_key_modal.studio_key_display': 'AI Studio Key',
    'api_key_modal.user_key_display': 'Your Key',
    'api_key_modal.description': 'You can use your own key to access the API. If you do not have a key, you can continue using the key provided by AI Studio.',
    'api_key_modal.placeholder': 'Paste your API key here...',
    'api_key_modal.save_button': 'Save and use my key',
    'api_key_modal.use_studio_key_button': 'Use AI Studio Key',
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
    'changelog.title': "What's New",
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
    'info_modal.uploading_desc': "Get images onto the canvas in three ways: Drag & Drop them from your desktop, paste from your clipboard (Ctrl+V), or use the '+' button on the generation bar.",
    'info_modal.interacting_title': "Interacting with Images",
    'info_modal.interacting_desc': "Select an image with a click. Add to a selection with Shift+Click, or drag a marquee to select multiple. Drag to move, or use the corner handles to resize.",
    'info_modal.floating_buttons_title': "Floating Buttons",
    'info_modal.floating_buttons_desc': "When you select a single image, a handy trio of buttons appears above it: Edit, Aspect Ratio, Enhance, Download, and Delete. Quick access to the most common actions!",

    'info_modal.editor_title': "The Editor: Precision Control",
    'info_modal.editor_desc': "Double-click an image or press the 'Edit' button to enter this focused mode. Here, you add the details that guide the AI.",
    'info_modal.confirm_edits_title': "Confirm Edits",
    'info_modal.confirm_edits_desc': "The checkmark button saves your annotations and layers, then takes you back to the main canvas.",
    'info_modal.layers_title': "Layers",
    'info_modal.layers_desc': "The '+' button is your gateway to complex compositions. Add new images as layers, then move and resize them. The AI is smart enough to understand layers when you generate!",
    'info_modal.drawing_tools_title': "Drawing Tools",
    'info_modal.drawing_tools_desc': "Use the Brush and Lasso to mask areas for the AI to change. Use the Arrow to indicate movement or action, and Text for specific labels.",

    'info_modal.right_toolbar_title': "The Control Panel",
    'info_modal.right_toolbar_desc': "Your universal toolkit for managing your workflow, available in both Canvas and Editor views.",
    'info_modal.undo_redo_title': "Undo & Redo",
    'info_modal.undo_redo_desc': "Your safety net. It works for everything: moving images on the canvas, drawing in the editor, and even after a generation.",
    'info_modal.selection_hand_title': "Selection & Hand",
    'info_modal.selection_hand_desc': "Switch between selecting/moving objects (Selection tool) and panning the canvas (Hand tool). Pro-tip: just hold Spacebar to temporarily activate the Hand tool!",
    'info_modal.focus_title': "Focus",
    'info_modal.focus_desc': "Lost in your canvas? Double-click the background or use this button to reset the view and see everything.",
    'info_modal.clear_title': "Clear",
    'info_modal.clear_desc': "Context-aware clearing! On the canvas, it clears everything. In the editor, it only removes the sketches and layers from the image you're working on.",

    'info_modal.generation_bar_title': "The Generation Bar: Where Magic Happens",
    'info_modal.generation_bar_desc': "This is your command center for communicating with the AI. You can resize it by dragging its edges.",
    'info_modal.prompt_area_title': "Prompt Area",
    'info_modal.prompt_area_desc': "Describe your desired changes. Use @-references (like @1, @2) to refer to images—they'll even light up on the canvas! Click the expand button for a larger editing window.",
    'info_modal.action_buttons_title': "Action Buttons",
    'info_modal.action_buttons_desc': "Quickly add images, browse hundreds of professional Presets, or toggle Magic Prompt to let the AI enhance your ideas. Use Enhance to improve quality, Reasoning to see the AI's plan, and Generate to bring it all to life.",
    
    'info_modal.protips_title': "Pro-Tips & Creative Combos",
    'info_modal.protip1_title': "The Compositor",
    'info_modal.protip1_desc': "Add a character image as a new layer in the Editor. Return to the canvas, select the main image, and prompt: 'Integrate the character from the top layer into the scene realistically.' The AI will blend them together!",
    'info_modal.protip2_title': "The Debugger",
    'info_modal.protip2_desc': "Generation not what you expected? Use Reasoning. It draws the AI's plan on the image. If the arrows are wrong, your prompt needs clarification. It's like reading the AI's mind!",
    'info_modal.protip3_title': "The Idea Machine",
    'info_modal.protip3_desc': "Creative block? Upload an image, leave the prompt empty, toggle on Magic Prompt, and hit Generate. The AI will invent a creative edit for you.",
    'info_modal.protip4_title': "The Upscaler",
    'info_modal.protip4_desc': "For blurry photos, use Enhance first. This gives the AI a high-quality canvas to work with, resulting in vastly better edits.",
    'info_modal.protip5_title': "The Teleporter",
    'info_modal.protip5_desc': "Use reference images (@2, @3) for more than just style. Upload a background as @2 and prompt: 'Place the person from @1 into the environment of @2.'",
    'info_modal.protip6_title': "The Speedrunner",
    'info_modal.protip6_desc': "Master hotkeys! They are your fastest path to creation. See the dedicated Hotkeys section below to learn them all.",
    'info_modal.final_tip_title': "Final Tip: Experiment!",
    'info_modal.final_tip_desc': "The best results come from playing around. Combine tools, try strange prompts, and see what happens. Happy creating!",

    'info_modal.hotkeys_title': "Hotkeys & Shortcuts",
    'info_modal.hotkeys_desc': "Speed up your workflow by mastering these keyboard shortcuts.",
    'info_modal.hotkeys_generation_title': "Generation",
    'info_modal.hotkey_generate': "Generate",
    'info_modal.hotkey_reasoning': "Reasoning",
    'info_modal.hotkey_enhance': "Enhance",
    'info_modal.hotkey_edit_image': "Edit Image",
    'info_modal.hotkey_magic_prompt': "Toggle Magic Prompt",
    'info_modal.hotkeys_tools_title': "Tools",
    'info_modal.hotkey_tool_selection': "Selection Tool",
    'info_modal.hotkey_tool_hand': "Hand Tool",
    'info_modal.hotkey_tool_brush': "Brush Tool",
    'info_modal.hotkey_tool_lasso': "Lasso Tool",
    'info_modal.hotkey_tool_arrow': "Arrow Tool",
    'info_modal.hotkey_tool_text': "Text Tool",
    'info_modal.hotkeys_canvas_title': "Canvas Control",
    'info_modal.hotkey_undo': "Undo",
    'info_modal.hotkey_redo': "Redo",
    'info_modal.hotkey_delete': "Delete Selected",
    'info_modal.hotkey_add_image': "Add Image",
    'info_modal.hotkey_presets': "Open Presets",
    'info_modal.hotkey_expand_prompt': "Expand Prompt Editor",
    'info_modal.hotkey_aspect_ratio': "Aspect Ratio Editor",
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
    'hall_of_fame.upgraders': 'Upgraders',
    'hall_of_fame.boosters': 'Boosters',
    'hall_of_fame.creator_desc': 'The original author and mad scientist behind BananaCrunch.',
    'hall_of_fame.islam_desc': 'Contributed over 200 professional presets and has been instrumental in refining and testing new features.',
    'hall_of_fame.max_kim_desc': 'The first to showcase the application to a wide audience, kickstarting its journey.',
    'hall_of_fame.belyak_desc': 'Provided a detailed review and valuable feedback that helped improve the user experience.',
    'hall_of_fame.memes_desc': 'Among the first to support and spread the word about the project.',
    'hall_of_fame.golden_boys': 'Golden Boys',
    'hall_of_fame.nazar_desc': 'Supported the project with 1000 ₽.',
    'hall_of_fame.mikheys_desc': 'Contributed to the project: prompt clearing, prompt history in the Log button, and the MIX function.'

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
    'log.magic_prompt_active': '"Волшебный промпт" активирован. Улучшаю промпт...',
    'log.magic_prompt_success': 'Промпт успешно улучшен.',
    'log.magic_prompt_fail': 'Не удалось улучшить промпт, используется исходный.',
    'log.magic_prompt_fail_json': 'Не удалось разобрать улучшенный промпт от модели, используется исходный.',
    'log.magic_prompt_error': 'Ошибка при улучшении промпта: {message}',
    'error.api_key_not_set': 'API-ключ не установлен. Пожалуйста, установите ключ.',
    'error.no_annotations_or_prompt': 'Пожалуйста, добавьте аннотации или напишите инструкцию для генерации изображения.',
    'error.blocked_by_safety': 'Ваш запрос был заблокирован по соображениям безопасности (Причина: {reason}). Пожалуйста, измените свой промпт или аннотации.',
    'error.model_no_response': 'Модель не дала ответа. Это может быть связано с перегрузкой сервера или внутренней ошибкой. Пожалуйста, попробуйте еще раз.',
    'error.content_blocked_by_safety': 'Сгенерированный контент был заблокирован по соображениям безопасности. Пожалуйста, измените свой промпт, чтобы он соответствовал политикам безопасности.',
    'error.model_no_image': 'Модель не вернула изображение в своем ответе. Попробуйте изменить свои аннотации или промпт, чтобы они были более четкими.',
    'error.unknown': 'Произошла неизвестная ошибка.',
    'error.api_key_invalid': 'Ваш API-ключ недействителен. Пожалуйста, проверьте его и попробуйте еще раз.',
    'error.quota_exceeded_studio': 'Квота на использование API превышена. Пожалуйста, попробуйте позже.',
    'error.quota_exceeded_user': 'Квота на использование API превышена. Пожалуйста, попробуйте позже.',
    'error.api_error_prefix': 'Ошибка API:',
    'error.no_image_to_download': 'Не выбрано изображение для скачивания.',
    'error.ref_image_fail': 'Не удалось обработать референсные изображения.',
    'error.no_image_to_enhance': 'Пожалуйста, выберите изображение для улучшения.',
    'error.no_image_to_mix': 'Пожалуйста, выберите одно изображение для смешивания.',
    'error.magic_prompt_generate_fail': 'Волшебный промпт не смог сгенерировать идею. Пожалуйста, попробуйте снова или введите промпт.',
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
    'uploader.change_api_key': 'Изменить API-ключ',
    'toolbar.left.home': 'Домой',
    'toolbar.left.add_layer': 'Добавить слой',
    'toolbar.left.brush': 'Кисть',
    'toolbar.left.lasso': 'Лассо',
    'toolbar.left.arrow': 'Стрелка',
    'toolbar.left.text': 'Текст',
    'toolbar.left.enhance': 'Прорисовка деталей',
    'toolbar.rtx': 'Улучшить 3D графику',
    'toolbar.mix': 'Mix (соедини коллаж в сцену)',
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
    'toolbar.right.change_api_key_title': 'Изменить API-ключ',
    'toolbar.right.api_key_label': 'API',
    'toolbar.right.studio_key_label': '(Студия)',
    'toolbar.right.ui_lang_title': 'Язык интерфейса',
    'generate_bar.placeholder': 'Опишите желаемые изменения...',
    'generate_bar.add_image': 'Добавить изображение',
    'generate_bar.download': 'Скачать',
    'generate_bar.presets_beta': 'Пресеты',
    'generate_bar.magic_prompt': 'Волшебный промпт',
    'generate_bar.reasoning': 'Рассуждение',
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
    'api_key_status.studio': 'Студия',
    'api_key_status.user': 'Ваш',
    'api_key_modal.title': 'Управление API-ключом',
    'api_key_modal.current_key': 'Текущий активный ключ:',
    'api_key_modal.studio_key_display': 'Ключ AI Studio',
    'api_key_modal.user_key_display': 'Ваш ключ',
    'api_key_modal.description': 'Вы можете использовать свой собственный ключ для доступа к API. Если у вас нет ключа, вы можете продолжать использовать ключ, предоставленный AI Studio.',
    'api_key_modal.placeholder': 'Вставьте ваш API-ключ сюда...',
    'api_key_modal.save_button': 'Сохранить и использовать мой ключ',
    'api_key_modal.use_studio_key_button': 'Использовать ключ AI Studio',
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
    'changelog.title': 'Что нового',
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
    'info_modal.uploading_desc': "Получите изображения на холст тремя способами: перетащите их с рабочего стола, вставьте из буфера обмена (Ctrl+V) или используйте кнопку '+' на панели генерации.",
    'info_modal.interacting_title': "Взаимодействие с изображениями",
    'info_modal.interacting_desc': "Выберите изображение кликом. Добавьте к выделению с помощью Shift+Click или перетащите рамку для выбора нескольких. Перетаскивайте для перемещения или используйте угловые маркеры для изменения размера.",
    'info_modal.floating_buttons_title': "Плавающие кнопки",
    'info_modal.floating_buttons_desc': "Когда вы выбираете одно изображение, над ним появляется удобное трио кнопок: Редактировать, Соотношение сторон, Улучшить, Скачать и Удалить. Быстрый доступ к самым частым действиям!",
    'info_modal.editor_title': "Редактор: точный контроль",
    'info_modal.editor_desc': "Дважды щелкните изображение или нажмите кнопку 'Редактировать', чтобы войти в этот сфокусированный режим. Здесь вы добавляете детали, которые направляют ИИ.",
    'info_modal.confirm_edits_title': "Подтвердить правки",
    'info_modal.confirm_edits_desc': "Кнопка с галочкой сохраняет ваши аннотации и слои, а затем возвращает вас на основной холст.",
    'info_modal.layers_title': "Слои",
    'info_modal.layers_desc': "Кнопка '+' — ваш путь к сложным композициям. Добавляйте новые изображения в качестве слоев, затем перемещайте и изменяйте их размер. ИИ достаточно умен, чтобы понимать слои при генерации!",
    'info_modal.drawing_tools_title': "Инструменты рисования",
    'info_modal.drawing_tools_desc': "Используйте кисть и лассо, чтобы замаскировать области для изменения ИИ. Используйте стрелку для указания движения или действия, и текст для конкретных меток.",
    'info_modal.right_toolbar_title': "Панель управления",
    'info_modal.right_toolbar_desc': "Ваш универсальный набор инструментов для управления рабочим процессом, доступный как в режиме холста, так и в режиме редактора.",
    'info_modal.undo_redo_title': "Отменить и повторить",
    'info_modal.undo_redo_desc': "Ваша страховка. Работает для всего: перемещение изображений на холсте, рисование в редакторе и даже после генерации.",
    'info_modal.selection_hand_title': "Выделение и рука",
    'info_modal.selection_hand_desc': "Переключайтесь между выбором/перемещением объектов (инструмент 'Выделение') и панорамированием холста (инструмент 'Рука'). Про-совет: просто удерживайте пробел, чтобы временно активировать инструмент 'Рука'!",
    'info_modal.focus_title': "Фокус",
    'info_modal.focus_desc': "Потерялись на холсте? Дважды щелкните по фону или используйте эту кнопку, чтобы сбросить вид и увидеть все.",
    'info_modal.clear_title': "Очистить",
    'info_modal.clear_desc': "Контекстно-зависимая очистка! На холсте она очищает все. В редакторе — удаляет только наброски и слои с изображения, над которым вы работаете.",
    'info_modal.generation_bar_title': "Панель генерации: где происходит волшебство",
    'info_modal.generation_bar_desc': "Это ваш командный центр для общения с ИИ. Вы можете изменять его размер, перетаскивая его края.",
    'info_modal.prompt_area_title': "Область промпта",
    'info_modal.prompt_area_desc': "Опишите желаемые изменения. Используйте @-ссылки (например, @1, @2) для обращения к изображениям — они даже будут подсвечиваться на холсте! Нажмите кнопку 'Развернуть' для большего окна редактирования.",
    'info_modal.action_buttons_title': "Кнопки действий",
    'info_modal.action_buttons_desc': "Быстро добавляйте изображения, просматривайте сотни профессиональных пресетов или включайте 'Волшебный промпт', чтобы ИИ улучшил ваши идеи. Используйте 'Улучшить' для повышения качества, 'Рассуждение', чтобы увидеть план ИИ, и 'Генерировать', чтобы воплотить все это в жизнь.",
    'info_modal.protips_title': "Про-советы и креативные комбинации",
    'info_modal.protip1_title': "Компоновщик",
    'info_modal.protip1_desc': "Добавьте изображение персонажа как новый слой в редакторе. Вернитесь на холст, выберите основное изображение и напишите промпт: 'Интегрируй персонажа с верхнего слоя в сцену реалистично'. ИИ смешает их вместе!",
    'info_modal.protip2_title': "Отладчик",
    'info_modal.protip2_desc': "Генерация не такая, как вы ожидали? Используйте 'Рассуждение'. Оно рисует план ИИ на изображении. Если стрелки неправильные, ваш промпт нуждается в уточнении. Это как читать мысли ИИ!",
    'info_modal.protip3_title': "Машина идей",
    'info_modal.protip3_desc': "Творческий ступор? Загрузите изображение, оставьте промпт пустым, включите 'Волшебный промпт' и нажмите 'Генерировать'. ИИ придумает для вас креативное изменение.",
    'info_modal.protip4_title': "Улучшатель",
    'info_modal.protip4_desc': "Для размытых фотографий сначала используйте 'Улучшить'. Это дает ИИ высококачественный холст для работы, что приводит к значительно лучшим правкам.",
    'info_modal.protip5_title': "Телепортер",
    'info_modal.protip5_desc': "Используйте референсные изображения (@2, @3) не только для стиля. Загрузите фон как @2 и напишите промпт: 'Помести человека из @1 в окружение из @2'.",
    'info_modal.protip6_title': "Спидраннер",
    'info_modal.protip6_desc': "Освойте горячие клавиши! Это ваш самый быстрый путь к творчеству. Смотрите специальный раздел 'Горячие клавиши' ниже, чтобы выучить их все.",
    'info_modal.final_tip_title': "Финальный совет: экспериментируйте!",
    'info_modal.final_tip_desc': "Лучшие результаты получаются в процессе игры. Комбинируйте инструменты, пробуйте странные промпты и смотрите, что получится. Счастливого творчества!",

    'info_modal.hotkeys_title': "Горячие клавиши и шорткаты",
    'info_modal.hotkeys_desc': "Ускорьте свой рабочий процесс, освоив эти сочетания клавиш.",
    'info_modal.hotkeys_generation_title': "Генерация",
    'info_modal.hotkey_generate': "Генерировать",
    'info_modal.hotkey_reasoning': "Рассуждение",
    'info_modal.hotkey_enhance': "Улучшить",
    'info_modal.hotkey_edit_image': "Редактировать изображение",
    'info_modal.hotkey_magic_prompt': "Переключить Волшебный промпт",
    'info_modal.hotkeys_tools_title': "Инструменты",
    'info_modal.hotkey_tool_selection': "Инструмент выделения",
    'info_modal.hotkey_tool_hand': "Инструмент 'Рука'",
    'info_modal.hotkey_tool_brush': "Инструмент 'Кисть'",
    'info_modal.hotkey_tool_lasso': "Инструмент 'Лассо'",
    'info_modal.hotkey_tool_arrow': "Инструмент 'Стрелка'",
    'info_modal.hotkey_tool_text': "Инструмент 'Текст'",
    'info_modal.hotkeys_canvas_title': "Управление холстом",
    'info_modal.hotkey_undo': "Отменить",
    'info_modal.hotkey_redo': "Повторить",
    'info_modal.hotkey_delete': "Удалить выделенное",
    'info_modal.hotkey_add_image': "Добавить изображение",
    'info_modal.hotkey_presets': "Открыть пресеты",
    'info_modal.hotkey_expand_prompt': "Развернуть редактор промпта",
    'info_modal.hotkey_aspect_ratio': "Редактор соотношения сторон",
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
    'hall_of_fame.upgraders': 'Улучшатели',
    'hall_of_fame.boosters': 'Бустеры',
    'hall_of_fame.creator_desc': 'Автор и безумный ученый, стоящий за BananaCrunch.',
    'hall_of_fame.islam_desc': 'Внес более 200 профессиональных пресетов и сыграл ключевую роль в доработке и тестировании новых функций.',
    'hall_of_fame.max_kim_desc': 'Первым продемонстрировал приложение широкой аудитории, дав старт его пути.',
    'hall_of_fame.belyak_desc': 'Предоставил подробный обзор и ценные отзывы, которые помогли улучшить пользовательский опыт.',
    'hall_of_fame.memes_desc': 'Один из первых, кто поддержал и распространил информацию о проекте.',
    'hall_of_fame.golden_boys': 'Спонсоры',
    'hall_of_fame.nazar_desc': 'поддержал проект на 1000 ₽',
    'hall_of_fame.mikheys_desc': 'привнёс в проект: удаление промпта, историю промптов в кнопке Log и функцию MIX'
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
