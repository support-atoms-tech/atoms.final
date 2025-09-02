'use client';

import { FlaskConical, GitBranch, Table as TableIcon } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { JSX, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    TableBody,
    TableCell,
    Table as TableComponent,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useOrganizationProjects } from '@/hooks/queries/useProject';
import { useOrganization } from '@/lib/providers/organization.provider';

type Level = 'System' | 'Sub-System' | 'Component';
type Status = 'Verified' | 'Pending Review' | 'Active';
type TestStatus = 'Pass' | 'Fail';

interface Item {
    id: string;
    title: string;
    level: Level;
    status: Status;
    testCoverage: number;
    testStatus: TestStatus;
    children?: Item[];
}

const statusStyles: Record<Status, string> = {
    Verified: 'bg-purple-600 text-white',
    'Pending Review': 'bg-yellow-500 text-black',
    Active: 'bg-blue-600 text-white',
};

const testStatusStyles: Record<TestStatus, string> = {
    Pass: 'bg-green-600 text-white',
    Fail: 'bg-red-600 text-white',
};

function renderStatus(status: Status) {
    return (
        <Badge
            className={`${statusStyles[status]} px-2 py-0.5 text-xs font-medium border-0`}
            variant="secondary"
        >
            {status}
        </Badge>
    );
}

function renderTestStatus(status: TestStatus) {
    return (
        <Badge
            className={`${testStatusStyles[status]} px-2 py-0.5 text-xs font-medium border-0`}
            variant="secondary"
        >
            {status}
        </Badge>
    );
}

function randomStatus(): Status {
    const options: Status[] = ['Verified', 'Pending Review', 'Active'];
    return options[Math.floor(Math.random() * options.length)];
}

function randomTestStatus(): TestStatus {
    return Math.random() > 0.5 ? 'Pass' : 'Fail';
}

function createItem(id: string, title: string, level: Level): Item {
    return {
        id,
        title,
        level,
        status: randomStatus(),
        testCoverage: Math.floor(Math.random() * 100),
        testStatus: randomTestStatus(),
    };
}

function generateSampleData(): Item[] {
    return Array.from({ length: 7 }, (_, i) => {
        const base = `REQ-${i + 1}`;
        return {
            ...createItem(base, `Requirement ${i + 1}`, 'System'),
            children: [
                {
                    ...createItem(`${base}.1`, `Requirement ${i + 1}.1`, 'Sub-System'),
                    children: [
                        createItem(
                            `${base}.1.1`,
                            `Requirement ${i + 1}.1.1`,
                            'Component',
                        ),
                    ],
                },
            ],
        };
    });
}

function flatten(items: Item[]): Item[] {
    const result: Item[] = [];
    const traverse = (arr: Item[]) => {
        arr.forEach((item) => {
            result.push(item);
            if (item.children) traverse(item.children);
        });
    };
    traverse(items);
    return result;
}

function HierarchyItem({ item }: { item: Item }) {
    return (
        <li className="relative pl-6">
            <div className="flex items-center gap-2 cursor-pointer hover:bg-muted rounded px-2 py-1">
                <span className="font-medium">
                    {item.id} - {item.title}
                </span>
                {renderStatus(item.status)}
            </div>
            {item.children && (
                <ul className="mt-2 space-y-2">
                    {item.children.map((child) => (
                        <li key={child.id} className="relative pl-6">
                            <span className="absolute left-0 top-0 bottom-0 border-l border-border" />
                            <span className="absolute left-0 top-4 w-6 border-t border-border" />
                            <HierarchyItem item={child} />
                        </li>
                    ))}
                </ul>
            )}
        </li>
    );
}

function renderHierarchy(items: Item[]): JSX.Element {
    return (
        <ul className="space-y-2">
            {items.map((item) => (
                <HierarchyItem key={item.id} item={item} />
            ))}
        </ul>
    );
}

export default function TraceabilityPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const view = searchParams.get('view') ?? 'matrix';

    const { currentOrganization } = useOrganization();
    const { data: projects = [] } = useOrganizationProjects(
        currentOrganization?.id || '',
    );
    const [selectedProject, setSelectedProject] = useState('');

    const sampleData = useMemo(generateSampleData, []);
    const allItems = useMemo(() => flatten(sampleData), [sampleData]);

    const testSummary = useMemo(() => {
        const pass = allItems.filter((i) => i.testStatus === 'Pass').length;
        const fail = allItems.length - pass;
        return { pass, fail };
    }, [allItems]);

    const passPercent =
        allItems.length === 0 ? 0 : (testSummary.pass / allItems.length) * 100;

    const handleTabChange = (next: string) => {
        router.push(`/traceability?view=${next}`);
    };

    return (
        <Tabs
            value={view}
            onValueChange={handleTabChange}
            className="flex flex-col h-full p-4"
        >
            <div className="mb-4 flex items-center gap-4">
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                    <SelectTrigger className="w-64">
                        <SelectValue placeholder="Select Project" />
                    </SelectTrigger>
                    <SelectContent>
                        {projects.map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                                {project.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <TabsList className="w-fit">
                    <TabsTrigger value="matrix" className="flex items-center gap-1">
                        <TableIcon className="h-4 w-4" />
                        <span className="font-semibold">Matrix View</span>
                    </TabsTrigger>
                    <TabsTrigger value="hierarchy" className="flex items-center gap-1">
                        <GitBranch className="h-4 w-4" />
                        <span className="font-semibold">Hierarchy View</span>
                    </TabsTrigger>
                    <TabsTrigger value="test" className="flex items-center gap-1">
                        <FlaskConical className="h-4 w-4" />
                        <span className="font-semibold">Test Requirement</span>
                    </TabsTrigger>
                </TabsList>
            </div>

            <TabsContent value="matrix" className="flex-1">
                <Card className="h-full flex flex-col">
                    <CardHeader className="py-4">
                        <CardTitle className="text-lg font-bold">Matrix View</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 overflow-auto flex-1">
                        <TableComponent className="w-full text-sm border border-border rounded-md overflow-hidden">
                            <TableHeader className="bg-muted/50">
                                <TableRow className="border-b">
                                    <TableHead className="px-4 py-2 text-left font-bold">
                                        ID
                                    </TableHead>
                                    <TableHead className="px-4 py-2 text-left font-bold">
                                        Title
                                    </TableHead>
                                    <TableHead className="px-4 py-2 text-left font-bold">
                                        Level
                                    </TableHead>
                                    <TableHead className="px-4 py-2 text-left font-bold">
                                        Status
                                    </TableHead>
                                    <TableHead className="px-4 py-2 text-right font-bold">
                                        Test Coverage
                                    </TableHead>
                                    <TableHead className="px-4 py-2 text-center font-bold">
                                        Test Status
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {allItems.map((item, idx) => (
                                    <TableRow
                                        key={item.id}
                                        className={
                                            'cursor-pointer transition-colors border-b last:border-0 hover:bg-muted/50 ' +
                                            (idx % 2 === 0
                                                ? 'bg-background'
                                                : 'bg-muted/20')
                                        }
                                    >
                                        <TableCell className="px-4 py-2 font-medium whitespace-nowrap">
                                            {item.id}
                                        </TableCell>
                                        <TableCell className="px-4 py-2">
                                            {item.title}
                                        </TableCell>
                                        <TableCell className="px-4 py-2">
                                            {item.level}
                                        </TableCell>
                                        <TableCell className="px-4 py-2 text-center">
                                            {renderStatus(item.status)}
                                        </TableCell>
                                        <TableCell className="px-4 py-2 text-right">
                                            {item.testCoverage}
                                        </TableCell>
                                        <TableCell className="px-4 py-2 text-center">
                                            {renderTestStatus(item.testStatus)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </TableComponent>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="hierarchy" className="flex-1">
                <Card className="h-full flex flex-col">
                    <CardHeader className="py-4">
                        <CardTitle className="text-lg font-bold">
                            Hierarchy View
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="overflow-auto flex-1 text-sm">
                        {renderHierarchy(sampleData)}
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="test" className="flex-1">
                <Card className="h-full flex flex-col">
                    <CardHeader className="py-4">
                        <CardTitle className="text-lg font-bold">
                            Test Requirement
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 overflow-auto flex-1">
                        <div className="flex flex-col items-center mb-4">
                            <div
                                className="w-40 h-40 rounded-full"
                                style={{
                                    background: `conic-gradient(#16a34a 0% ${passPercent}%, #dc2626 ${passPercent}% 100%)`,
                                }}
                            />
                            <div className="flex gap-4 text-sm mt-2">
                                <div className="flex items-center gap-1">
                                    <span className="w-4 h-4 rounded-sm bg-green-600" />
                                    Pass {testSummary.pass}
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="w-4 h-4 rounded-sm bg-red-600" />
                                    Fail {testSummary.fail}
                                </div>
                            </div>
                        </div>
                        <TableComponent className="w-full text-sm border border-border rounded-md overflow-hidden">
                            <TableHeader className="bg-muted/50">
                                <TableRow className="border-b">
                                    <TableHead className="px-4 py-2 text-left font-bold">
                                        ID
                                    </TableHead>
                                    <TableHead className="px-4 py-2 text-left font-bold">
                                        Title
                                    </TableHead>
                                    <TableHead className="px-4 py-2 text-right font-bold">
                                        Test Coverage
                                    </TableHead>
                                    <TableHead className="px-4 py-2 text-center font-bold">
                                        Test Status
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {allItems.map((item, idx) => (
                                    <TableRow
                                        key={item.id}
                                        className={
                                            'cursor-pointer transition-colors border-b last:border-0 hover:bg-muted/50 ' +
                                            (idx % 2 === 0
                                                ? 'bg-background'
                                                : 'bg-muted/20')
                                        }
                                    >
                                        <TableCell className="px-4 py-2 font-medium whitespace-nowrap">
                                            {item.id}
                                        </TableCell>
                                        <TableCell className="px-4 py-2">
                                            {item.title}
                                        </TableCell>
                                        <TableCell className="px-4 py-2 text-right">
                                            {item.testCoverage}
                                        </TableCell>
                                        <TableCell className="px-4 py-2 text-center">
                                            {renderTestStatus(item.testStatus)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </TableComponent>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
}
