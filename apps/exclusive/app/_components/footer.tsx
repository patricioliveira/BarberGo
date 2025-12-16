import { Card, CardContent } from "@barbergo/ui"

const Footer = () => {
    return (
        <footer>
            <Card className="rounded-none border-0 border-t">
                <CardContent className="px-5 py-6">
                    <p className="text-sm text-gray-400">
                        © 2024 Copyright <span className="font-bold">BarberGo</span>
                    </p>
                </CardContent>
            </Card>
        </footer>
    )
}

export default Footer