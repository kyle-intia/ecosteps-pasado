"use client";

import React, { useState, useMemo } from "react";
import * as LucideIcons from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface IconPickerProps {
  value: string;
  onChange: (value: string) => void;
}

const IconPicker = ({ value, onChange }: IconPickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  // ✅ Filter: only real React components, no "...Icon" duplicates
  const allIcons = useMemo(() => {
    return Object.keys(LucideIcons).filter(
      (name) => /^[A-Z]/.test(name) && !name.endsWith("Icon")
    );
  }, []);

  const filteredIcons = allIcons.filter((iconName) =>
    iconName.toLowerCase().includes(search.toLowerCase())
  );

  const SelectedIcon =
    value && LucideIcons[value as keyof typeof LucideIcons]
      ? (LucideIcons[value as keyof typeof LucideIcons] as React.ComponentType<any>)
      : null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          {SelectedIcon ? (
            <>
              <SelectedIcon className="w-4 h-4 mr-2" />
              {value}
            </>
          ) : (
            "Select Icon"
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select an Icon</DialogTitle>
          <DialogDescription>
            Search and pick from all Lucide icons
          </DialogDescription>
        </DialogHeader>

        <Input
          placeholder="Search icon..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-4"
        />

        <div className="grid grid-cols-5 gap-4">
          {filteredIcons.length > 0 ? (
            filteredIcons.map((iconName) => {
              const IconComp =
                LucideIcons[iconName as keyof typeof LucideIcons] as React.ComponentType<any>;
              return (
                <button
                  key={iconName}
                  className="flex flex-col items-center p-2 border rounded hover:bg-muted"
                  onClick={() => {
                    onChange(iconName);
                    setIsOpen(false);
                  }}
                >
                  {IconComp && <IconComp className="w-6 h-6 mb-1" />}
                  <span className="text-xs truncate">{iconName}</span>
                </button>
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground col-span-5 text-center">
              No icons found
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default IconPicker;
