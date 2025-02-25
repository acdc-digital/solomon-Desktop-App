// ChatLayout.tsx
// /Users/matthewsimon/Documents/GitHub/acdc.solomon-electron/solomon-electron/next/src/components/chat/Chatlayout.tsx

'use client'

import React from 'react';
import useChatStore from '@/lib/store/chatStore';
import Chat from './Chat';
import { useEditorStore } from '@/lib/store/editorStore';

export default function ChatLayout() {
    const { isChatActive, deactivateChat } = useChatStore(); // Access the chat visibility state
    const { projectId } = useEditorStore();

    return (
        <div className='flex flex-col items-center h-full w-full'>
            {isChatActive && projectId ? (
                <div className='flex flex-col h-full w-full'>
                    {/* Chat Content */}
                    <div className='flex-1 overflow-y-auto'>
                        <Chat projectId={projectId} />
                    </div>
                </div>
            ) : (
                <p className='text-center text-gray-600'>Choose a project to continue.</p>
            )}
        </div>
    );
}