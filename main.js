let leaderboardData = [];
    let currentMode = 'all';
    let searchQuery = '';

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
            console.log("Dữ liệu nhận từ Appwrite:", data); // Bật F12 Console trên web để kiểm tra nếu còn lỗi
            
            if (data.documents) {
                leaderboardData = data.documents.map(doc => {
                    let parsedTiers = { Sword: "Unranked", Nethop: "Unranked", SMP: "Unranked", Uhc: "Unranked", Axe: "Unranked", Vanilla: "Unranked", Mace: "Unranked" };
                    
                    let rawTierInput = doc.tiers || doc.tier || "";

                    if (typeof rawTierInput === 'string') {
                        let cleanStr = rawTierInput.trim();
                        // Nếu người chơi gõ một chữ duy nhất (ví dụ: "HT1") thì gán hết cho các mode
                        if (!cleanStr.includes(':') && !cleanStr.includes('{')) {
                            parsedTiers = { Sword: cleanStr, Nethop: cleanStr, SMP: cleanStr, Uhc: cleanStr, Axe: cleanStr, Vanilla: cleanStr, Mace: cleanStr };
                        } else {
                            // Xử lý dạng "Sword: HT1, Nethop: HT2"
                            let parts = cleanStr.split(',');
                            parts.forEach(p => {
                                let kv = p.split(':');
                                if (kv.length === 2) {
                                    let k = kv[0].trim().toLowerCase();
                                    let v = kv[1].trim();
                                    let matchedKey = Object.keys(parsedTiers).find(item => item.toLowerCase() === k);
                                    if (matchedKey) parsedTiers[matchedKey] = v;
                                }
                            });
                        }
                    }

                    return {
                        name: doc.name || doc.username || "Unknown",
                        points: doc.points || 0,
                        skin: doc.skin || doc.name || doc.username || "Steve",
                        tiers: parsedTiers
                    };
                });
            }

            renderLeaderboard();
        } catch (error) {
            console.error("Lỗi kết nối Appwrite:", error);
            if (container) {
                container.innerHTML = `
                    <div class="py-16 text-center text-red-400 text-xs flex flex-col items-center justify-center gap-2">
                        <span>Lỗi kết nối Appwrite! Hãy kiểm tra lại quyền Read (Any) trong Collection.</span>
                    </div>
                `;
            }
        }
    }

    function renderLeaderboard() {
        const container = document.getElementById('leaderboard-body');
        if (!container) return;

        let filtered = leaderboardData.filter(player => {
            return player.name.toLowerCase().includes(searchQuery.toLowerCase());
        });

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="py-16 text-center text-gray-500 text-xs flex flex-col items-center justify-center gap-2">
                    <span>Không tìm thấy người chơi nào.</span>
                </div>
            `;
            return;
        }

        const modesList = ['Sword', 'Nethop', 'SMP', 'Uhc', 'Axe', 'Vanilla', 'Mace'];

        container.innerHTML = filtered.map((player, index) => {
            const avatarUrl = `https://vzge.me/avatars/100/${player.skin}`;

            let tiersHtml = modesList.map(m => {
                let val = player.tiers[m] || '-';
                let isRanked = val !== '-' && val.toLowerCase() !== 'unranked';
                let style = isRanked 
                    ? 'bg-pink-500/20 border-pink-500/40 text-pink-300 font-extrabold' 
                    : 'bg-gray-800/40 border-gray-700/30 text-gray-500 font-normal';

                return `
                    <div class="flex flex-col items-center justify-center gap-1 w-9">
                        <span class="text-[10px] text-gray-400 uppercase tracking-tighter">${m.slice(0,3)}</span>
                        <span class="text-[11px] px-1.5 py-0.5 rounded border ${style} shadow-sm">${val}</span>
                    </div>
                `;
            }).join('');

            return `
                <div class="grid grid-cols-12 px-8 py-4 items-center hover:bg-gray-800/30 transition-colors border-b border-gray-800/40">
                    <div class="col-span-1 font-extrabold text-gray-400 text-sm">#${index + 1}</div>
                    <div class="col-span-5 flex items-center gap-3.5">
                        <div class="w-10 h-10 rounded-2xl bg-gray-800/80 border border-gray-700/50 overflow-hidden flex items-center justify-center shadow-md">
                            <img src="${avatarUrl}" class="w-full h-full object-cover" alt="${player.name}" onerror="this.src='https://api.iconify.design/twemoji:bust-in-silhouette.svg'">
                        </div>
                        <span class="font-bold text-white text-sm tracking-wide">${player.name}</span>
                    </div>
                    <div class="col-span-2 text-center font-extrabold text-pink-400 text-sm">${player.points} pts</div>
                    <div class="col-span-4 flex items-center justify-end gap-1.5 pr-2 overflow-x-auto">
                        ${tiersHtml}
                    </div>
                </div>
            `;
        }).join('');
    }

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
