// Danh sách người chơi lấy từ Appwrite
    let leaderboardData = [];

    let currentMode = 'all';
    let searchQuery = '';

    // Hàm gọi dữ liệu trực tiếp từ Appwrite Collection
    async function fetchLeaderboardFromAppwrite() {
        const container = document.getElementById('leaderboard-body');
        if (container) {
            container.innerHTML = `
                <div class="py-16 text-center text-gray-400 text-xs flex flex-col items-center justify-center gap-2">
                    <span>Đang đồng bộ dữ liệu từ Appwrite...</span>
                </div>
            `;
        }

        try {
            const response = await fetch(`https://sgp.cloud.appwrite.io/v1/databases/6abe0bb6000caab818b9/collections/6abe0d8300108a42b831/documents`, {
                headers: {
                    'X-Appwrite-Project': '6abe0b1f00000e883399',
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            
            if (data.documents) {
                leaderboardData = data.documents.map(doc => {
                    let parsedTiers = { Sword: doc.tier || "Unranked" };
                    
                    if (doc.tiers) {
                        if (typeof doc.tiers === 'object') {
                            parsedTiers = doc.tiers;
                        } else if (typeof doc.tiers === 'string') {
                            let raw = doc.tiers.trim();
                            try {
                                parsedTiers = JSON.parse(raw);
                            } catch (e) {
                                parsedTiers = {};
                                const entries = raw.split(',');
                                entries.forEach(entry => {
                                    if (entry.includes(':')) {
                                        const parts = entry.split(':');
                                        const modeKey = parts[0].trim();
                                        const tierVal = parts[1].trim();
                                        // Chuẩn hóa key viết hoa chữ cái đầu cho khớp với giao diện
                                        const formattedKey = modeKey.charAt(0).toUpperCase() + modeKey.slice(1).toLowerCase();
                                        parsedTiers[formattedKey] = tierVal;
                                    }
                                });
                                
                                if (Object.keys(parsedTiers).length === 0) {
                                    parsedTiers = { 
                                        Sword: raw, 
                                        Nethop: raw, 
                                        SMP: raw, 
                                        Uhc: raw, 
                                        Axe: raw, 
                                        Vanilla: raw, 
                                        Mace: raw 
                                    };
                                }
                            }
                        }
                    }

                    return {
                        name: doc.name || doc.username || "Unknown",
                        points: doc.points || 0,
                        skin: doc.skin || doc.name || "Steve",
                        tiers: parsedTiers
                    };
                });
            }

            renderLeaderboard();
        } catch (error) {
            console.error("Lỗi tải dữ liệu từ Appwrite:", error);
            if (container) {
                container.innerHTML = `
                    <div class="py-16 text-center text-red-400 text-xs flex flex-col items-center justify-center gap-2">
                        <span>Không thể kết nối tới cơ sở dữ liệu Appwrite!</span>
                    </div>
                `;
            }
        }
    }

    // Hàm render danh sách ra HTML
    function renderLeaderboard() {
        const container = document.getElementById('leaderboard-body');
        if (!container) return;

        // Lọc theo chế độ chơi nếu không phải 'all'
        let filtered = leaderboardData.filter(player => {
            const matchesSearch = player.name.toLowerCase().includes(searchQuery.toLowerCase());
            if (currentMode === 'all') return matchesSearch;
            
            // Tìm kiếm không phân biệt hoa thường cho các key trong tiers
            const modeKeys = Object.keys(player.tiers).map(k => k.toLowerCase());
            const hasMode = modeKeys.includes(currentMode.toLowerCase());
            
            return matchesSearch && hasMode;
        });

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="py-16 text-center text-gray-500 text-xs flex flex-col items-center justify-center gap-2">
                    <img src="https://api.iconify.design/twemoji:open-mailbox-with-lowered-flag.svg" class="w-8 h-8 opacity-60" alt="Empty">
                    <span>Chưa có người chơi nào được cập nhật tier trong chế độ này.</span>
                </div>
            `;
            return;
        }

        const modesList = ['Sword', 'Nethop', 'SMP', 'Uhc', 'Axe', 'Vanilla', 'Mace'];

        container.innerHTML = filtered.map((player, index) => {
            const avatarUrl = `https://vzge.me/avatars/100/${player.skin}`;

            // Tạo chuỗi hiển thị các tier nhỏ theo từng icon chế độ
            let tiersHtml = modesList.map(m => {
                // Tìm kiếm key trong player.tiers không phân biệt hoa thường
                const foundKey = Object.keys(player.tiers).find(k => k.toLowerCase() === m.toLowerCase());
                const tVal = foundKey ? player.tiers[foundKey] : '-';
                return `<div class="w-8 text-center text-[11px] font-bold text-gray-300" title="${m}: ${tVal}">${tVal}</div>`;
            }).join('');

            return `
                <div class="grid grid-cols-12 px-8 py-4 items-center hover:bg-gray-800/30 transition-colors">
                    <div class="col-span-1 font-extrabold text-gray-400 text-sm">#${index + 1}</div>
                    <div class="col-span-5 flex items-center gap-3.5">
                        <div class="w-10 h-10 rounded-2xl bg-gray-800/80 border border-gray-700/50 overflow-hidden flex items-center justify-center shadow-md">
                            <img src="${avatarUrl}" class="w-full h-full object-cover" alt="${player.name}" onerror="this.src='https://api.iconify.design/twemoji:bust-in-silhouette.svg'">
                        </div>
                        <span class="font-bold text-white text-sm tracking-wide">${player.name}</span>
                    </div>
                    <div class="col-span-2 text-center font-extrabold text-pink-400 text-sm">${player.points} pts</div>
                    <div class="col-span-4 flex items-center justify-end gap-3 pr-4 overflow-x-auto">
                        ${tiersHtml}
                    </div>
                </div>
            `;
        }).join('');
    }

    // Hàm xử lý khi bấm nút chọn chế độ chơi
    function filterMode(mode) {
        currentMode = mode;

        const buttons = document.querySelectorAll('.mode-btn');
        buttons.forEach(btn => {
            const btnMode = btn.getAttribute('data-mode');
            if (btnMode === mode) {
                btn.className = "mode-btn flex flex-col items-center justify-center gap-1.5 px-4 py-3 rounded-2xl text-[11px] font-bold bg-gradient-to-r from-pink-400 to-rose-500 text-gray-950 shadow-lg shadow-pink-500/20 whitespace-nowrap transition-all duration-300 min-w-[85px]";
            } else {
                btn.className = "mode-btn flex flex-col items-center justify-center gap-1.5 px-4 py-3 rounded-2xl text-[11px] font-semibold bg-gray-900/80 text-gray-400 hover:text-pink-300 hover:bg-gray-800 border border-gray-800/80 hover:border-pink-500/30 whitespace-nowrap transition-all duration-300 min-w-[85px]";
            }
        });

        renderLeaderboard();
    }

    // Lắng nghe sự kiện tìm kiếm và khởi chạy
    document.addEventListener('DOMContentLoaded', () => {
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                searchQuery = e.target.value.trim();
                renderLeaderboard();
            });
        }

        fetchLeaderboardFromAppwrite();
        filterMode('all');
    });
