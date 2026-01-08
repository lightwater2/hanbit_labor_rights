/**
 * DataLoader - CSV 데이터 로더
 *
 * 배포 시 DATA_BASE_URL을 외부 스토리지 URL로 설정:
 * <script>window.DATA_BASE_URL = 'https://your-storage.com/data/';</script>
 */
const DataLoader = {
    getBaseURL() {
        return window.DATA_BASE_URL || './data/';
    },

    async loadCSV(filename) {
        const url = this.getBaseURL() + filename;
        return new Promise((resolve, reject) => {
            Papa.parse(url, {
                download: true,
                header: true,
                skipEmptyLines: true,
                complete: (results) => resolve(results.data),
                error: (error) => reject(error)
            });
        });
    },

    async getAllData() {
        try {
            const [categories, quotes, stats] = await Promise.all([
                this.loadCSV('categories.csv'),
                this.loadCSV('quotes.csv'),
                this.loadCSV('stats.csv')
            ]);

            return { categories, quotes, stats };
        } catch (error) {
            console.error('Error loading CSV files:', error);
            return null;
        }
    }
};

window.DataLoader = DataLoader;
