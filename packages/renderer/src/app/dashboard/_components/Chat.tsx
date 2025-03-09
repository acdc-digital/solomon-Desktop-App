import React from 'react';
import ChatLayout from '@/components/chat/Chatlayout';
import useChatStore from '@/lib/store/chatStore';
import { initResize } from '@/components/chat/Resizer';
import { GripVertical } from 'lucide-react';

const MIN_WIDTH = 300;
const MAX_WIDTH = 550;

const Chat: React.FC = () => {
  const { chatWidth, setChatWidth } = useChatStore();

  return (
    <div className="flex h-full shrink-0">
      {/* Chat Panel with relative positioning to contain the resizer */}
      <div
        id="chatPanel"
        className="flex flex-col border-l bg-white shrink-0 relative z-50"
        style={{
          width: `${chatWidth}px`,
          minWidth: `${MIN_WIDTH}px`,
          maxWidth: `${MAX_WIDTH}px`,
          position: 'absolute', // Changed from relative to absolute
          right: 0,
          top: 0,
          bottom: 0,
          height: '100%',
          overflowY: 'visible', // Add overflow control
          boxShadow: '-0.5px 0 8px rgba(0, 0, 0, 0.1)'
        }}
      >
        {/* Full-height resizer that extends to both sides of the border */}
        <div 
          className="absolute h-full w-8 -left-4 top-0 z-10 flex items-center justify-center cursor-col-resize"
          onMouseDown={(e) => initResize(e, setChatWidth, MIN_WIDTH, MAX_WIDTH)}
          onTouchStart={(e) => initResize(e, setChatWidth, MIN_WIDTH, MAX_WIDTH)}
          role="separator"
          aria-label="Resize chat panel"
        >
          {/* Thin Vertical Line */}
          <div className="h-full w-px bg-gray-300 absolute left-1/2 transform -translate-x-1/2" />
          
          {/* Handle with hover effects */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-4 h-14 bg-white/70 rounded shadow-sm border border-gray-300 hover:bg-white hover:shadow-md transition-all duration-200">
            <GripVertical className="h-4 w-4 text-gray-600" />
          </div>
        </div>

        <ChatLayout />
      </div>
    </div>
  );
};

export default Chat;