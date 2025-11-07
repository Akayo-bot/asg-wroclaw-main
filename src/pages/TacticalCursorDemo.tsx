import TacticalCursor from '@/components/TacticalCursor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const TacticalCursorDemo = () => {
    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Tactical Cursor */}
            <TacticalCursor
                targetSelector=".cursor-tactical"
                spinDuration={3}
                hideDefaultCursor={true}
                color="#4CAF50"
                size={14}
            />

            {/* Demo Content */}
            <div className="container mx-auto px-4 py-20">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-bold font-rajdhani mb-4">
                        TACTICAL CURSOR DEMO
                    </h1>
                    <p className="text-lg text-muted-foreground">
                        Hover over the elements below to see the tactical targeting system in action
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* Interactive Cards */}
                    <Card className="cursor-tactical hover:bg-muted/50 transition-colors">
                        <CardHeader>
                            <CardTitle className="text-primary">Tactical Button</CardTitle>
                            <CardDescription>
                                This card responds to the tactical cursor
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button className="cursor-tactical w-full">
                                Click Me
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="cursor-tactical hover:bg-muted/50 transition-colors">
                        <CardHeader>
                            <CardTitle className="text-primary">Target Practice</CardTitle>
                            <CardDescription>
                                Perfect your aim with this interactive element
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <Button variant="outline" className="cursor-tactical w-full">
                                    Primary Target
                                </Button>
                                <Button variant="secondary" className="cursor-tactical w-full">
                                    Secondary Target
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="cursor-tactical hover:bg-muted/50 transition-colors">
                        <CardHeader>
                            <CardTitle className="text-primary">Mission Control</CardTitle>
                            <CardDescription>
                                Navigate through tactical operations
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col space-y-2">
                                <Button variant="destructive" className="cursor-tactical">
                                    Emergency Protocol
                                </Button>
                                <Button variant="ghost" className="cursor-tactical">
                                    Status Report
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Interactive Elements */}
                    <div className="cursor-tactical p-6 bg-card rounded-lg border border-border hover:border-primary/50 transition-colors">
                        <h3 className="text-xl font-semibold mb-4 text-primary">Interactive Zone</h3>
                        <p className="text-muted-foreground mb-4">
                            This entire area is a tactical target. Move your cursor around to see the targeting system adapt.
                        </p>
                        <div className="flex space-x-2">
                            <Button size="sm" className="cursor-tactical">Action 1</Button>
                            <Button size="sm" variant="outline" className="cursor-tactical">Action 2</Button>
                        </div>
                    </div>

                    <div className="cursor-tactical p-6 bg-card rounded-lg border border-border hover:border-primary/50 transition-colors">
                        <h3 className="text-xl font-semibold mb-4 text-primary">Targeting System</h3>
                        <p className="text-muted-foreground mb-4">
                            The cursor will create a targeting reticle around this element when you hover over it.
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            <Button size="sm" className="cursor-tactical">Fire</Button>
                            <Button size="sm" variant="outline" className="cursor-tactical">Hold</Button>
                        </div>
                    </div>

                    <div className="cursor-tactical p-6 bg-card rounded-lg border border-border hover:border-primary/50 transition-colors">
                        <h3 className="text-xl font-semibold mb-4 text-primary">Mission Brief</h3>
                        <p className="text-muted-foreground mb-4">
                            Each interactive element provides tactical feedback through the custom cursor system.
                        </p>
                        <Button className="cursor-tactical w-full">
                            Accept Mission
                        </Button>
                    </div>
                </div>

                {/* Instructions */}
                <div className="mt-16 text-center">
                    <Card className="max-w-2xl mx-auto">
                        <CardHeader>
                            <CardTitle className="text-primary">How to Use Tactical Cursor</CardTitle>
                        </CardHeader>
                        <CardContent className="text-left space-y-4">
                            <div className="flex items-start space-x-3">
                                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground">1</div>
                                <div>
                                    <h4 className="font-semibold">Move Your Mouse</h4>
                                    <p className="text-sm text-muted-foreground">The tactical cursor follows your mouse movement with smooth animations</p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-3">
                                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground">2</div>
                                <div>
                                    <h4 className="font-semibold">Target Elements</h4>
                                    <p className="text-sm text-muted-foreground">Hover over elements with the "cursor-tactical" class to activate targeting mode</p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-3">
                                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground">3</div>
                                <div>
                                    <h4 className="font-semibold">Click to Engage</h4>
                                    <p className="text-sm text-muted-foreground">The cursor responds to clicks with tactical feedback animations</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default TacticalCursorDemo;
