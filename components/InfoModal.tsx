
import React, { useRef, useEffect, useState } from 'react';
import Icon from './Icon';

interface InfoModalProps {
    isOpen: boolean;
    onClose: () => void;
    t: (key: string) => string;
}

const InfoSection: React.FC<{ title: string; desc: string; }> = ({ title, desc }) => (
    <div className="mb-4">
        <h4 className="text-lg font-bold text-white mb-1">{title}</h4>
        <p className="text-gray-300 whitespace-pre-wrap">{desc}</p>
    </div>
);

const HotkeyEntry: React.FC<{ keys: string; description: string; }> = ({ keys, description }) => (
    <div className="flex justify-between items-center py-2 border-b border-white/5 last:border-b-0">
        <span className="text-gray-300">{description}</span>
        <div className="flex gap-1.5 flex-shrink-0 ml-4">
            {keys.split(',').map(keyGroup =>
                keyGroup.trim().split('+').map(key => (
                    <kbd key={key} className="px-2 py-1 text-xs font-semibold text-gray-200 bg-[#2a2a2a] border border-[#383838] rounded-md min-w-[24px] text-center">{key.trim()}</kbd>
                ))
            )}
        </div>
    </div>
);

const AccordionSection: React.FC<{ title: string; children: React.ReactNode; isOpen: boolean; onToggle: () => void; icon: string; }> = ({ title, children, isOpen, onToggle, icon }) => {
    return (
        <div className="mb-2">
            <button
                onClick={onToggle}
                className="w-full text-left p-3 bg-[#2a2a2a] hover:bg-[#383838] rounded-lg transition-colors text-gray-200 flex justify-between items-center"
            >
                <div className="flex items-center gap-3">
                    <Icon name={icon} className="w-6 h-6 text-[#d1fe17]" />
                    <h3 className="text-xl font-semibold">{title}</h3>
                </div>
                <Icon name={isOpen ? 'chevron-up' : 'chevron-down'} className="w-6 h-6 transition-transform" />
            </button>
            <div
                className="overflow-hidden transition-all duration-500 ease-in-out"
                style={{ maxHeight: isOpen ? '2000px' : '0px' }}
            >
                <div className="pt-4 pl-4 ml-4 border-l-2 border-gray-700">
                    {children}
                </div>
            </div>
        </div>
    );
};


const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose, t }) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const [openSection, setOpenSection] = useState<string | null>('workspace');
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleToggle = (sectionName: string) => {
        setOpenSection(prev => (prev === sectionName ? null : sectionName));
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div ref={modalRef} className="relative flex flex-col bg-[#1c1c1c] rounded-2xl p-6 shadow-2xl border border-[#262626] w-full max-w-3xl max-h-[85vh]">
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h3 className="text-2xl font-bold text-white">{t('info_modal.title')}</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-gray-400">
                        <Icon name="x" className="w-6 h-6" />
                    </button>
                </div>
                <div className="flex-grow overflow-y-auto space-y-2 pr-4">
                    <p className="text-gray-400 mb-4">{t('info_modal.p1')}</p>

                    <AccordionSection title={t('info_modal.workspace_title')} isOpen={openSection === 'workspace'} onToggle={() => handleToggle('workspace')} icon="pixels">
                         <p className="text-gray-300 whitespace-pre-wrap mb-4">{t('info_modal.workspace_desc')}</p>
                         <InfoSection title={t('info_modal.uploading_title')} desc={t('info_modal.uploading_desc')} />
                         <InfoSection title={t('info_modal.interacting_title')} desc={t('info_modal.interacting_desc')} />
                         <InfoSection title={t('info_modal.floating_buttons_title')} desc={t('info_modal.floating_buttons_desc')} />
                    </AccordionSection>
                    
                    <AccordionSection title={t('info_modal.editor_title')} isOpen={openSection === 'editor'} onToggle={() => handleToggle('editor')} icon="edit">
                        <p className="text-gray-300 whitespace-pre-wrap mb-4">{t('info_modal.editor_desc')}</p>
                        <InfoSection title={t('info_modal.confirm_edits_title')} desc={t('info_modal.confirm_edits_desc')} />
                        <InfoSection title={t('info_modal.layers_title')} desc={t('info_modal.layers_desc')} />
                        <InfoSection title={t('info_modal.drawing_tools_title')} desc={t('info_modal.drawing_tools_desc')} />
                    </AccordionSection>

                    <AccordionSection title={t('info_modal.right_toolbar_title')} isOpen={openSection === 'toolbar'} onToggle={() => handleToggle('toolbar')} icon="hand">
                         <p className="text-gray-300 whitespace-pre-wrap mb-4">{t('info_modal.right_toolbar_desc')}</p>
                         <InfoSection title={t('info_modal.undo_redo_title')} desc={t('info_modal.undo_redo_desc')} />
                         <InfoSection title={t('info_modal.selection_hand_title')} desc={t('info_modal.selection_hand_desc')} />
                         <InfoSection title={t('info_modal.focus_title')} desc={t('info_modal.focus_desc')} />
                         <InfoSection title={t('info_modal.clear_title')} desc={t('info_modal.clear_desc')} />
                    </AccordionSection>
                    
                    <AccordionSection title={t('info_modal.generation_bar_title')} isOpen={openSection === 'generation'} onToggle={() => handleToggle('generation')} icon="sparkles">
                        <p className="text-gray-300 whitespace-pre-wrap mb-4">{t('info_modal.generation_bar_desc')}</p>
                        <InfoSection title={t('info_modal.prompt_area_title')} desc={t('info_modal.prompt_area_desc')} />
                        <InfoSection title={t('info_modal.action_buttons_title')} desc={t('info_modal.action_buttons_desc')} />
                    </AccordionSection>
                    
                    <AccordionSection title={t('info_modal.protips_title')} isOpen={openSection === 'protips'} onToggle={() => handleToggle('protips')} icon="lightbulb">
                        <InfoSection title={t('info_modal.protip1_title')} desc={t('info_modal.protip1_desc')} />
                        <InfoSection title={t('info_modal.protip2_title')} desc={t('info_modal.protip2_desc')} />
                        <InfoSection title={t('info_modal.protip3_title')} desc={t('info_modal.protip3_desc')} />
                        <InfoSection title={t('info_modal.protip4_title')} desc={t('info_modal.protip4_desc')} />
                        <InfoSection title={t('info_modal.protip5_title')} desc={t('info_modal.protip5_desc')} />
                        <InfoSection title={t('info_modal.protip6_title')} desc={t('info_modal.protip6_desc')} />
                        <InfoSection title={t('info_modal.final_tip_title')} desc={t('info_modal.final_tip_desc')} />
                    </AccordionSection>

                    <AccordionSection title={t('info_modal.hotkeys_title')} isOpen={openSection === 'hotkeys'} onToggle={() => handleToggle('hotkeys')} icon="key">
                        <p className="text-gray-400 mb-4">{t('info_modal.hotkeys_desc')}</p>
                        
                        <h4 className="text-lg font-bold text-white mt-4 mb-2">{t('info_modal.hotkeys_generation_title')}</h4>
                        <HotkeyEntry keys="Ctrl/Cmd + Enter" description={t('info_modal.hotkey_generate')} />
                        <HotkeyEntry keys="Ctrl/Cmd + R, К" description={t('info_modal.hotkey_regenerate')} />
                        <HotkeyEntry keys="R, К" description={t('info_modal.hotkey_reasoning')} />
                        <HotkeyEntry keys="E, У" description={t('info_modal.hotkey_enhance')} />
                        <HotkeyEntry keys="Shift + E, У" description={t('info_modal.hotkey_edit_image')} />
                        <HotkeyEntry keys="M, Ь" description={t('info_modal.hotkey_magic_prompt')} />
                        <HotkeyEntry keys="B, И" description={t('info_modal.hotkey_bad_mode')} />
                        
                        <h4 className="text-lg font-bold text-white mt-4 mb-2">{t('info_modal.hotkeys_tools_title')}</h4>
                        <HotkeyEntry keys="V, М" description={t('info_modal.hotkey_tool_selection')} />
                        <HotkeyEntry keys="H, Р" description={t('info_modal.hotkey_tool_hand')} />
                        <HotkeyEntry keys="L, Д" description={t('info_modal.hotkey_tool_lasso')} />
                        <HotkeyEntry keys="A, Ф" description={t('info_modal.hotkey_tool_arrow')} />
                        <HotkeyEntry keys="I, Ш" description={t('info_modal.hotkey_tool_text')} />

                        <h4 className="text-lg font-bold text-white mt-4 mb-2">{t('info_modal.hotkeys_canvas_title')}</h4>
                        <HotkeyEntry keys="Ctrl/Cmd + Z" description={t('info_modal.hotkey_undo')} />
                        <HotkeyEntry keys="Ctrl/Cmd + Shift + Z, Ctrl+Y" description={t('info_modal.hotkey_redo')} />
                        <HotkeyEntry keys="Del / Backspace" description={t('info_modal.hotkey_delete')} />
                        <HotkeyEntry keys="+" description={t('info_modal.hotkey_add_image')} />
                        <HotkeyEntry keys="C, С" description={t('info_modal.hotkey_camera')} />
                        <HotkeyEntry keys="P, З" description={t('info_modal.hotkey_presets')} />
                        <HotkeyEntry keys="T, Е" description={t('info_modal.hotkey_expand_prompt')} />
                        <HotkeyEntry keys="Shift + A, Ф" description={t('info_modal.hotkey_aspect_ratio')} />
                        <HotkeyEntry keys="Ctrl/Cmd + Drag" description={t('info_modal.hotkey_proportional_resize')} />
                        <HotkeyEntry keys="Shift + S, Ы" description={t('info_modal.hotkey_download')} />
                        <HotkeyEntry keys="Spacebar (Hold)" description={t('info_modal.hotkey_temp_hand')} />
                        <HotkeyEntry keys="Esc" description={t('info_modal.hotkey_cancel_aspect')} />
                    </AccordionSection>

                </div>
            </div>
        </div>
    );
};

export default InfoModal;