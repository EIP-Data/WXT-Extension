import { ref, onMounted, onUnmounted } from 'vue';

export function useDraggable() {
    const position = ref({ x: 0, y: 0 });
    const isDragging = ref(false);
    const dragStart = ref({ x: 0, y: 0 });

    const loadPosition = async () => {
        const result = await browser.storage.local.get(['overlayPosition']);
        if (result.overlayPosition) {
            position.value = result.overlayPosition;
        } else {
            // Default position (top-right with some margin)
            position.value = { x: window.innerWidth - 380, y: 20 };
        }
    };

    const savePosition = async () => {
        await browser.storage.local.set({ overlayPosition: position.value });
    };

    const startDrag = (event: MouseEvent) => {
        isDragging.value = true;
        dragStart.value = {
            x: event.clientX - position.value.x,
            y: event.clientY - position.value.y,
        };

        // Prevent text selection during drag
        event.preventDefault();
        document.body.style.userSelect = 'none';
    };

    const onDrag = (event: MouseEvent) => {
        if (!isDragging.value) return;

        const newX = event.clientX - dragStart.value.x;
        const newY = event.clientY - dragStart.value.y;

        // Keep overlay within viewport bounds
        const maxX = window.innerWidth - 360; // overlay width
        const maxY = window.innerHeight - 100; // minimum visible height

        position.value = {
            x: Math.max(0, Math.min(newX, maxX)),
            y: Math.max(0, Math.min(newY, maxY)),
        };
    };

    const stopDrag = () => {
        if (isDragging.value) {
            isDragging.value = false;
            document.body.style.userSelect = '';
            savePosition();
        }
    };

    onMounted(() => {
        loadPosition();
        window.addEventListener('mousemove', onDrag);
        window.addEventListener('mouseup', stopDrag);
    });

    onUnmounted(() => {
        window.removeEventListener('mousemove', onDrag);
        window.removeEventListener('mouseup', stopDrag);
    });

    return {
        position,
        isDragging,
        startDrag,
    };
}
